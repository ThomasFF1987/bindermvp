export default async function EditBinderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <main className="p-8">Edit binder (placeholder) — id: {id}</main>
}
