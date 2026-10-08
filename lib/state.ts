export type DemoState = {
  onboarded: boolean;
  joined: string[];
  people: string[];
  clubs: string[];
  posts: {
    id: string;
    topic: string;
    title: string;
    text: string;
    replies: string[];
  }[];
  replies: Record<string, string[]>;
  saved: string[];
  read: string[];
  votes: string[];
  following: string[];
  feedback: Record<string, number>;
  notes: Record<string, string>;
  comments: Record<string, string[]>;
  folders: Record<string, string>;
  threadVotes: string[];
  followThreads: string[];
};
export const initial: DemoState = {
  onboarded: false,
  joined: [],
  people: [],
  clubs: [],
  posts: [],
  replies: {},
  saved: ['2310.08560', '2210.03629', '2407.04620'],
  read: ['2210.03629'],
  votes: [],
  following: ['Agent Memory', 'Agent Systems'],
  feedback: {},
  notes: {
    '2210.03629':
      '把 Thought → Action → Observation 的循环接入工具执行器。下一步：记录工具失败时的恢复轨迹。',
  },
  comments: {},
  folders: {
    '2310.08560': 'agents',
    '2210.03629': 'agents',
    '2407.04620': 'ideas',
  },
  threadVotes: [],
  followThreads: [],
};

const arrayFields = [
  'joined',
  'people',
  'clubs',
  'saved',
  'read',
  'votes',
  'following',
  'threadVotes',
  'followThreads',
] as const;
function object(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}
function strings(x: unknown): x is string[] {
  return (
    Array.isArray(x) &&
    x.length <= 500 &&
    x.every((v) => typeof v === 'string' && v.length <= 2000)
  );
}
export function validateState(x: unknown): x is DemoState {
  if (
    !object(x) ||
    typeof x.onboarded !== 'boolean' ||
    !arrayFields.every((k) => strings(x[k]))
  )
    return false;
  for (const k of ['notes', 'folders', 'feedback', 'comments', 'replies']) {
    const map = x[k];
    if (!object(map) || Object.keys(map).length > 500) return false;
    if (
      !Object.entries(map).every(
        ([id, v]) =>
          id.length <= 200 &&
          (k === 'feedback'
            ? [-1, 0, 1].includes(v as number)
            : k === 'comments' || k === 'replies'
              ? strings(v)
              : typeof v === 'string' && v.length <= 50000),
      )
    )
      return false;
  }
  return (
    Array.isArray(x.posts) &&
    x.posts.length <= 500 &&
    x.posts.every(
      (p) =>
        object(p) &&
        typeof p.id === 'string' &&
        p.id.length <= 200 &&
        typeof p.topic === 'string' &&
        p.topic.length <= 200 &&
        typeof p.title === 'string' &&
        p.title.length <= 150 &&
        typeof p.text === 'string' &&
        p.text.length <= 5000 &&
        strings(p.replies),
    )
  );
}
export function restoreState(x: unknown): DemoState {
  if (!object(x)) throw new Error('Invalid saved state');
  const result = { ...initial, ...x };
  if (!validateState(result)) throw new Error('Invalid saved state');
  return Object.fromEntries(
    Object.keys(initial).map((k) => [k, result[k as keyof DemoState]]),
  ) as DemoState;
}
/** Apply local changes since base to the latest server snapshot. Array deltas
 * preserve changes made in another tab; distinct notes and replies merge. */
export function mergeChanges(
  base: DemoState,
  local: DemoState,
  remote: DemoState,
): DemoState {
  const result = { ...remote };
  for (const key of arrayFields) {
    const removed = base[key].filter((x) => !local[key].includes(x));
    const added = local[key].filter((x) => !base[key].includes(x));
    result[key] = [
      ...new Set([
        ...remote[key].filter((x) => !removed.includes(x)),
        ...added,
      ]),
    ];
  }
  if (base.onboarded !== local.onboarded) result.onboarded = local.onboarded;
  for (const key of [
    'notes',
    'folders',
    'feedback',
    'comments',
    'replies',
  ] as const) {
    const value = { ...remote[key] } as Record<string, unknown>;
    for (const id of new Set([
      ...Object.keys(base[key]),
      ...Object.keys(local[key]),
    ])) {
      const before = base[key][id],
        after = local[key][id];
      if (JSON.stringify(before) === JSON.stringify(after)) continue;
      if (after === undefined) delete value[id];
      else if (
        (key === 'comments' || key === 'replies') &&
        Array.isArray(after)
      ) {
        const old = Array.isArray(before) ? before : [];
        const current = Array.isArray(value[id]) ? (value[id] as string[]) : [];
        // Appending comments never removes an identical reply from another device.
        value[id] =
          after.length >= old.length && old.every((v, i) => after[i] === v)
            ? [...current, ...after.slice(old.length)]
            : after;
      } else value[id] = after;
    }
    Object.assign(result, { [key]: value });
  }
  const removedPosts = base.posts
    .filter((p) => !local.posts.some((x) => x.id === p.id))
    .map((p) => p.id);
  result.posts = remote.posts.filter((p) => !removedPosts.includes(p.id));
  for (const post of local.posts) {
    const old = base.posts.find((p) => p.id === post.id);
    if (JSON.stringify(old) !== JSON.stringify(post)) {
      result.posts = result.posts.filter((p) => p.id !== post.id);
      result.posts.push(post);
    }
  }
  return restoreState(result);
}
