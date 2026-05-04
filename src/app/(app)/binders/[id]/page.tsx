export default async function BinderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <main className="p-8">Binder view (placeholder) — id: {id}</main>
}
