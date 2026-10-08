import Link from './native-link';
export default function NotFound() {
  return (
    <main style={{ padding: '15vh 10%', textAlign: 'center' }}>
      <h1>这条研究线索暂时不在这里。</h1>
      <p style={{ margin: '20px 0' }}>返回发现页，继续找一篇值得读的论文。</p>
      <Link href="/" className="btn primary">
        返回 PaperFeed
      </Link>
    </main>
  );
}
