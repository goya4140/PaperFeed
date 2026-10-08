import { getD1 } from '@/db';
import { restoreState, validateState } from '@/lib/state';
export const dynamic = 'force-dynamic';
type Row = { data: string; revision: number };
function identity(request: Request) {
  const user = request.headers.get('oai-authenticated-user-id');
  if (user) return { owner: `user:${user}`, cookie: '' };
  const existing = request.headers
    .get('cookie')
    ?.match(/(?:^|;\s*)pf_demo=([0-9a-f-]{36})(?:;|$)/)?.[1];
  const id = existing || crypto.randomUUID();
  return {
    owner: `demo:${id}`,
    cookie: existing
      ? ''
      : `pf_demo=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  };
}
function respond(data: unknown, status = 200, cookie = '') {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
    },
  });
}
export async function GET(request: Request) {
  const { owner, cookie } = identity(request);
  try {
    const row = await getD1()
      .prepare('SELECT data, revision FROM research_spaces WHERE owner = ?')
      .bind(owner)
      .first<Row>();
    return respond(
      {
        state: row ? restoreState(JSON.parse(row.data)) : null,
        revision: row?.revision || 0,
      },
      200,
      cookie,
    );
  } catch {
    return respond(
      { error: '研究空间暂时无法读取，请稍后重试。' },
      503,
      cookie,
    );
  }
}
export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return respond({ error: '请求来源不匹配。' }, 403);
  const { owner, cookie } = identity(request);
  try {
    const raw = await request.text();
    if (raw.length > 1000000)
      return respond({ error: '内容过大，请先导出并整理记录。' }, 413, cookie);
    let body;
    try { body = JSON.parse(raw); } catch {
      return respond({ error: '请求不是有效的 JSON。' }, 400, cookie);
    }
    if (!body || typeof body !== 'object')
      return respond({ error: '研究空间数据格式无效。' }, 422, cookie);
    if (
      !validateState(body.state) ||
      !Number.isSafeInteger(body.revision) ||
      body.revision < 0
    )
      return respond({ error: '研究空间数据格式无效。' }, 422, cookie);
    const db = getD1(),
      data = JSON.stringify(restoreState(body.state));
    const result =
      body.revision === 0
        ? await db
            .prepare(
              'INSERT INTO research_spaces (owner,data,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner) DO NOTHING',
            )
            .bind(owner, data, new Date().toISOString())
            .run()
        : await db
            .prepare(
              'UPDATE research_spaces SET data = ?, revision = revision + 1, updated_at = ? WHERE owner = ? AND revision = ?',
            )
            .bind(data, new Date().toISOString(), owner, body.revision)
            .run();
    if (result.meta.changes !== 1) {
      const latest = await db
        .prepare('SELECT data, revision FROM research_spaces WHERE owner = ?')
        .bind(owner)
        .first<Row>();
      return respond(
        {
          error: '另一个页面更新了记录。',
          state: latest ? restoreState(JSON.parse(latest.data)) : null,
          revision: latest?.revision || 0,
        },
        409,
        cookie,
      );
    }
    return respond({ revision: body.revision + 1 }, 200, cookie);
  } catch {
    return respond(
      { error: '研究空间暂时无法保存，请稍后重试。' },
      503,
      cookie,
    );
  }
}
