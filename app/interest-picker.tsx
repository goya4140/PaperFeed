'use client';
import { useState } from 'react';
import { topics } from '@/lib/papers';
import { useDemo, updateDemo } from '@/lib/demo-store';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
export function InterestPicker() {
  const s = useDemo();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<string[] | null>(null);
  const chosen = draft || s.following;
  return (
    <>
      <button
        className="btn"
        onClick={() => {
          setDraft([...s.following]);
          setEdit(true);
        }}
      >
        调整研究兴趣
      </button>
      {(!s.onboarded || edit) && <Dialog
        open
        onOpenChange={(v) => {
          if (!v && s.onboarded) setEdit(false);
        }}
      >
        <DialogContent>
          <DialogTitle>从你的好奇心开始</DialogTitle>
          <DialogDescription>
            选择你想了解的方向。收藏和反馈会继续调整推荐；这是可解释规则的演示。
          </DialogDescription>
          <div className="interest-options">
            {topics.map((t) => (
              <button
                key={t.name}
                className={`interest-option ${chosen.includes(t.name) ? 'selected' : ''}`}
                aria-pressed={chosen.includes(t.name)}
                onClick={() =>
                  setDraft(
                    chosen.includes(t.name)
                      ? chosen.filter((x) => x !== t.name)
                      : [...chosen, t.name],
                  )
                }
              >
                <strong>{t.name}</strong>
                <span>{t.desc}</span>
              </button>
            ))}
          </div>
          <button
            className="btn primary"
            disabled={!chosen.length}
            onClick={() => {
              updateDemo((d) => ({ ...d, onboarded: true, following: chosen }));
              setEdit(false);
              setDraft(null);
            }}
          >
            开启我的研究 Feed
          </button>
        </DialogContent>
      </Dialog>}
    </>
  );
}
