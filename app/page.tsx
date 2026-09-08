import Experience from './experience';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <Experience key={q || 'home'} searchQuery={q || ''} />;
}
