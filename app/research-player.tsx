'use client';
import { useEffect, useRef, useState } from 'react';
import clips from '@/lib/clips.json';
export { clips };
export function ResearchPlayer({ id }: { id: string }) {
  const clip = clips.find((c) => c.id === id)!;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(false),
    [captions, setCaptions] = useState(true),
    [time, setTime] = useState(0),
    [error, setError] = useState(''),
    [source, setSource] = useState(''),
    [attempt, setAttempt] = useState(0);
  let boundary = 0,
    scene = clip.scenes.length - 1;
  for (let i = 0; i < clip.scenes.length; i++) {
    boundary += clip.scenes[i].duration;
    if (time < boundary) {
      scene = i;
      break;
    }
  }
  const current = clip.scenes[scene];
  const duration = clip.scenes.reduce((n, s) => n + s.duration, 0);
  useEffect(() => {
    // The static preview may not provide byte ranges. A complete local Blob
    // gives browsers a seekable track without depending on server range support.
    const controller = new AbortController();
    const node = audio.current;
    let owned = '';
    setSource('');
    setError('');
    void fetch(clip.audio, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Media unavailable');
      const bytes = await response.arrayBuffer();
      if (controller.signal.aborted) return;
      owned = URL.createObjectURL(new Blob([bytes], { type: 'audio/mp4' }));
      setSource(owned);
    }).catch(() => {
      if (!controller.signal.aborted) setError('音频加载失败，请重新加载。');
    });
    return () => {
      controller.abort();
      node?.pause();
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [clip.audio, attempt]);
  async function play() {
    if (!audio.current) return;
    setError('');
    try {
      await audio.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError('播放未开始，请再点击播放。');
    }
  }
  function pause() {
    audio.current?.pause();
    setPlaying(false);
  }
  function seek(value: number) {
    if (audio.current) audio.current.currentTime = value;
    setTime(value);
  }
  const stamp = (v: number) =>
    `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
  return (
    <section
      className={`research-player ${playing ? 'is-playing' : ''}`}
      aria-label={`${clip.title}动态讲解`}
    >
      <audio
        ref={audio}
        src={source || undefined}
        muted={muted}
        preload="auto"
        onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onEnded={() => {
          setPlaying(false);
          setTime(duration);
        }}
        onError={() => {
          pause();
          setError('音频加载失败，请检查网络后重新播放。');
        }}
      />
      <div className="player-meta">
        <span>配音分镜 · 编辑原创讲解</span>
        <span>
          {scene + 1} / {clip.scenes.length}
        </span>
      </div>
      <div key={scene} className="player-scene">
        <small>{clip.title}</small>
        <h2>{current.heading}</h2>
        <div className="player-nodes">
          {current.nodes.map((x, i) => (
            <div key={x} style={{ animationDelay: `${i * 0.22}s` }}>
              <span>0{i + 1}</span>
              <strong>{x}</strong>
              {i < current.nodes.length - 1 && <i>↓</i>}
            </div>
          ))}
        </div>
      </div>
      <div className="player-caption" aria-live="off">
        {captions ? current.text : '字幕已关闭'}
      </div>
      <div className="player-controls">
        <button
          className="btn"
          disabled={!source}
          onClick={() => {
            if (playing) pause();
            else {
              if (time >= duration) seek(0);
              void play();
            }
          }}
        >
          {!source ? '加载讲解…' : playing ? '暂停' : '播放讲解'}
        </button>
        <button
          className="btn"
          onClick={() => setMuted(!muted)}
          aria-pressed={muted}
        >
          {muted ? '开启声音' : '静音'}
        </button>
        <button
          className="btn"
          onClick={() => setCaptions(!captions)}
          aria-pressed={captions}
        >
          字幕{captions ? '开' : '关'}
        </button>
        <span>
          {stamp(time)} / {stamp(duration)}
        </span>
      </div>
      <div className="player-timeline">
      <button aria-label="后退十秒" onClick={() => seek(Math.max(0, time - 10))}>−10</button>
      <input
        className="player-seek"
        aria-label="播放进度"
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={Math.min(time, duration)}
        onChange={(e) => seek(Number(e.target.value))}
        onKeyDown={(e) => {
          const next = e.key === 'Home' ? 0 : e.key === 'End' ? duration
            : e.key === 'ArrowRight' ? Math.min(duration, time + 1)
            : e.key === 'ArrowLeft' ? Math.max(0, time - 1) : null;
          if (next !== null) { e.preventDefault(); seek(next); }
        }}
      />
      <button aria-label="前进十秒" onClick={() => seek(Math.min(duration, time + 10))}>+10</button>
      </div>
      {error && <p role="alert">{error} <button className="btn" onClick={() => setAttempt(n => n + 1)}>重新加载</button></p>}
      <p className="player-footnote">
        合成配音与动态分镜，非作者演讲；事实依据见完整解读的原文链接。
      </p>
    </section>
  );
}
