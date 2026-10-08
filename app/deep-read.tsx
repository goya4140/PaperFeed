import Link from 'next/link';
import { deepReads } from '@/lib/deep-reads';
import { papers } from '@/lib/papers';
export function DeepArticle({ id }: { id: string }) {
  const a = deepReads[id];
  if (!a) return null;
  return (
    <article className="deep-article">
      <p className="eyebrow">DEEP READ · 编辑图文解读</p>
      <h2>{a.headline}</h2>
      <p className="deep-lead">{a.hook}</p>
      <figure>
        <div className="deep-flow">
          {a.flow.map((x, i) => (
            <div key={x}>
              <small>0{i + 1}</small>
              <strong>{x}</strong>
              {i < 3 && <span aria-hidden>↓</span>}
            </div>
          ))}
        </div>
        <figcaption>
          编辑重绘的机制示意，依据原文方法；不是原文实验图。
        </figcaption>
      </figure>
      {a.sections.map((x, i) => (
        <section key={x.title}>
          <small>{x.label}</small>
          <h3>
            {i + 1}. {x.title}
          </h3>
          <p>{x.text}</p>
          {i === 2 && (
            <figure className="deep-example">
              <strong>{a.example.title}</strong>
              <p>
                <small>对照思路</small>
                {a.example.before}
              </p>
              <p>
                <small>改进思路</small>
                {a.example.after}
              </p>
              <figcaption>编辑构造的解释性例子，不作为实验结果。</figcaption>
            </figure>
          )}
          {i === 3 && (
            <div className="evidence-grid">
              {a.evidence.map((e) => (
                <div key={e.label}>
                  <small>{e.label}</small>
                  <strong>{e.value}</strong>
                  <p>{e.context}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
      <p className="source-note">
        核验于 2026-10-08 ·{' '}
        <a href={a.source} target="_blank" rel="noreferrer">
          查看本解读所依据的原文版本 ↗
        </a>
      </p>
      <h3>对照阅读</h3>
      <div className="chips">
        {a.related.map((x) => (
          <Link className="chip" key={x} href={`/paper/${x}`}>
            {papers.find((p) => p.id === x)?.name} ↗
          </Link>
        ))}
      </div>
    </article>
  );
}
