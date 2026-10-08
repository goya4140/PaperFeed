'use client';
import { useSyncExternalStore } from 'react';
import { initial, restoreState, mergeChanges, type DemoState } from './state';
export { initial, type DemoState } from './state';
let state = initial,
  base = initial,
  revision = 0;
let loaded = false,
  ready = false,
  booting = false,
  busy = false,
  pending = false;
let status = '正在读取研究空间…';
const listeners = new Set<() => void>();
const key = 'paperfeed-demo-v3';
const emit = () => listeners.forEach((f) => f());
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
function cache() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ state, base, revision, pending }),
    );
  } catch {
    status = pending
      ? '本机缓存不可用；请保持页面打开并重试数据库保存。'
      : '已保存到数据库，但本机缓存不可用。';
  }
}
function readStorage() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(key),
      legacy = localStorage.getItem('paperfeed-demo-v2');
    if (raw) {
      const data = JSON.parse(raw);
      state = restoreState(data.state);
      base = restoreState(data.base);
      revision = Number.isSafeInteger(data.revision) ? data.revision : 0;
      pending = data.pending === true;
    } else if (legacy) {
      state = restoreState(JSON.parse(legacy));
      base = initial;
      pending = true;
    }
  } catch {
    state = initial;
    base = initial;
    pending = false;
    status = '本机记录无法读取，正在尝试从数据库恢复。';
  }
}
async function initialize() {
  if (booting || ready || typeof window === 'undefined') return;
  booting = true;
  const captured = state;
  try {
    const response = await fetch('/api/state', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = (await response.json()) as {
      state: unknown;
      revision: number;
    };
    if (data.state) {
      const remote = restoreState(data.state);
      state = mergeChanges(pending ? base : captured, state, remote);
      base = remote;
      revision = data.revision;
      pending = !same(state, remote);
    } else {
      revision = 0;
      pending = true;
    }
    ready = true;
    status = pending ? '正在保存到数据库…' : '已保存到数据库';
    cache();
    emit();
  } catch {
    status = '数据库暂不可用；操作保留在本机，等待重试。';
    emit();
  } finally {
    booting = false;
  }
  if (ready && pending) void flush();
}
async function flush() {
  if (busy) return;
  if (!ready) {
    void initialize();
    return;
  }
  if (!pending) return;
  busy = true;
  status = '正在保存到数据库…';
  emit();
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const snapshot = state,
        baseline = base;
      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: snapshot, revision }),
      });
      const data = (await response.json()) as {
        state: unknown;
        revision: number;
      };
      if (response.status === 409) {
        const remote = data.state ? restoreState(data.state) : initial;
        state = mergeChanges(baseline, state, remote);
        base = remote;
        revision = data.revision;
        pending = true;
        cache();
        emit();
        continue;
      }
      if (!response.ok) throw new Error();
      base = snapshot;
      revision = data.revision;
      pending = !same(state, snapshot);
      status = pending ? '正在保存到数据库…' : '已保存到数据库';
      cache();
      emit();
      if (!pending) break;
    }
    if (pending) throw new Error();
  } catch {
    status = '数据库保存未完成；已保留本机操作，可重试。';
    cache();
    emit();
  } finally {
    busy = false;
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  readStorage();
  void initialize();
  const onStorage = (e: StorageEvent) => {
    if (e.key === key && !busy) {
      loaded = false;
      ready = false;
      readStorage();
      emit();
      void initialize();
    }
  };
  const onOnline = () => {
    ready = false;
    void initialize();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener('online', onOnline);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('online', onOnline);
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
export function useStorageStatus() {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => '正在读取研究空间…',
  );
}
export function retrySync() {
  if (busy || booting) return;
  ready = false;
  status = '正在重新连接…';
  emit();
  void initialize();
}
export function updateDemo(fn: (s: DemoState) => DemoState) {
  readStorage();
  try {
    state = restoreState(fn(state));
  } catch {
    status = '记录超出保存范围，请先导出并整理。';
    emit();
    return;
  }
  pending = true;
  cache();
  emit();
  void flush();
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
  updateDemo(() => structuredClone(initial));
}
