'use client';
import { useEffect, useRef, useState } from 'react';
import clips from '@/lib/clips.json';
export { clips };
export function ResearchPlayer({ id }: { id: string }) {
  const clip = clips.find((c) => c.id === id)!;
  const audio = useRef<HTMLAudioElement>(null);
  const [scene, setScene] = useState(0),
    [playing, setPlaying] = useState(false),
    [muted, setMuted] = useState(false),
    [captions, setCaptions] = useState(true),
    [time, setTime] = useState(0),
    [error, setError] = useState('');
  const shouldPlay = useRef(false),
    seekTo = useRef(0);
  const current = clip.scenes[scene];
  const duration = clip.scenes.reduce((n, s) => n + s.duration, 0);
  const offset = clip.scenes
    .slice(0, scene)
    .reduce((n, s) => n + s.duration, 0);
  useEffect(() => {
    const node = audio.current;
    return () => {
      shouldPlay.current = false;
      node?.pause();
    };
  }, []);
  useEffect(() => {
    const node = audio.current;
    if (!node) return;
    node.load();
  }, [scene]);
  async function play() {
    if (!audio.current) return;
    setError('');
    shouldPlay.current = true;
    try {
      await audio.current.play();
      setPlaying(true);
    } catch {
      shouldPlay.current = false;
      setPlaying(false);
      setError('播放未开始，请再点击播放。');
    }
  }
  function pause() {
    shouldPlay.current = false;
    audio.current?.pause();
    setPlaying(false);
  }
  function seek(value: number) {
    let rest = value,
      index = 0;
    while (
      index < clip.scenes.length - 1 &&
      rest >= clip.scenes[index].duration
    ) {
      rest -= clip.scenes[index].duration;
      index++;
    }
    if (index === scene) {
      if (audio.current) audio.current.currentTime = rest;
      setTime(value);
    } else {
      seekTo.current = rest;
      setScene(index);
      setTime(value);
    }
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
        src={current.audio}
        muted={muted}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audio.current) {
            audio.current.currentTime = seekTo.current;
            seekTo.current = 0;
          }
          if (shouldPlay.current) void play();
        }}
        onTimeUpdate={() => setTime(offset + (audio.current?.currentTime || 0))}
        onEnded={() => {
          if (scene < clip.scenes.length - 1) {
            seekTo.current = 0;
            setScene(scene + 1);
          } else {
            shouldPlay.current = false;
            setPlaying(false);
            setTime(duration);
          }
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
          onClick={() => {
            if (playing) pause();
            else {
              if (time >= duration) {
                shouldPlay.current = true;
                setPlaying(true);
                seek(0);
              } else void play();
            }
          }}
        >
          {playing ? '暂停' : '播放讲解'}
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
      <input
        className="player-seek"
        aria-label="播放进度"
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={Math.min(time, duration)}
        onChange={(e) => seek(Number(e.target.value))}
      />
      {error && <p role="alert">{error}</p>}
      <p className="player-footnote">
        合成配音与动态分镜，非作者演讲；事实依据见完整解读的原文链接。
      </p>
    </section>
  );
}
