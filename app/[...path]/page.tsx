import Experience from '../experience';
import { papers, topics } from '@/lib/papers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
type Props = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<{ tab?: string }>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raw = await params;
  const path = raw.path.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  const p =
    path[0] === 'paper' ? papers.find((p) => p.id === path[1]) : undefined;
  return {
    title: p
      ? `${p.name} · PaperFeed`
      : `${path[0] === 'topic' ? path[1] : ({ explore: '探索主题', library: '我的文库', swipe: '刷一篇', discussions: '学术讨论', profile: '研究者主页' } as Record<string, string>)[path[0]] || '研究空间'} · PaperFeed`,
    description: p?.summary || '发现值得读、也适合你的研究。',
  };
}
export default async function Page({ params, searchParams }: Props) {
  const raw = await params;
  const path = raw.path.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  const { tab } = await searchParams;
  if (
    path[0] === 'paper' &&
    path.length === 2 &&
    papers.some((p) => p.id === path[1])
  )
    return (
      <Experience
        key={path.join('/') + tab}
        paperId={path[1]}
        initialTab={
          ['discussion', 'notes', 'resources'].includes(tab || '')
            ? tab
            : 'overview'
        }
      />
    );
  if (
    path[0] === 'topic' &&
    path.length === 2 &&
    topics.some((t) => t.name === path[1])
  )
    return <Experience topicName={path[1]} />;
  if (
    path.length === 1 &&
    ['explore', 'library', 'swipe', 'discussions', 'profile'].includes(path[0])
  )
    return <Experience route={'/' + path[0]} />;
  notFound();
}
