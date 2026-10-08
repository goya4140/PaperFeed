'use client';
import { useSyncExternalStore } from 'react';
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
let state = initial;
let loaded = false;
const listeners = new Set<() => void>();
const key = 'paperfeed-demo-v2';
function readStorage() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const x = JSON.parse(raw);
      if (x && Array.isArray(x.saved) && Array.isArray(x.following)) {
        state = { ...initial, ...x };
      }
    }
  } catch {
    state = initial;
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  readStorage();
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) {
      loaded = false;
      readStorage();
      listeners.forEach((f) => f());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}
export function useDemo() {
  return useSyncExternalStore(
    subscribe,
    () => {
      readStorage();
      return state;
    },
    () => initial,
  );
}
export function updateDemo(fn: (s: DemoState) => DemoState) {
  readStorage();
  state = fn(state);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* Demo remains usable when storage is unavailable. */
  }
  listeners.forEach((f) => f());
}
export function toggle(
  field:
    | 'joined'
    | 'people'
    | 'clubs'
    | 'saved'
    | 'read'
    | 'votes'
    | 'following'
    | 'threadVotes'
    | 'followThreads',
  id: string,
) {
  updateDemo((s) => ({
    ...s,
    [field]: s[field].includes(id)
      ? s[field].filter((x) => x !== id)
      : [...s[field], id],
  }));
}
export function resetDemo() {
  updateDemo(() => ({ ...initial }));
}
