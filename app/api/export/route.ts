export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return new Response('来源不匹配', { status: 403 });
  if (Number(request.headers.get('content-length')) > 1500000)
    return new Response('文件过大', { status: 413 });
  try {
    const form = await request.formData(),
      content = form.get('content'),
      name = form.get('name');
    if (
      typeof content !== 'string' ||
      content.length > 1000000 ||
      typeof name !== 'string' ||
      name.length > 180
    )
      return new Response('无效导出', { status: 422 });
    const safe = name.replace(/[\r\n"\\/]/g, '_');
    return new Response(content.replace(/\r\n/g, '\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safe.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(safe)}`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('无法生成文件', { status: 400 });
  }
}
