'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBinder, useDeleteBinder, useUpdateBinder } from '@/hooks/useBinders'
import type { PageFormat } from '@/types/binder'

export default function EditBinderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: binder, isLoading, error } = useBinder(id)
  const update = useUpdateBinder(id)
  const del = useDeleteBinder()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [pageFormat, setPageFormat] = useState<PageFormat>(9)
  const [pageCount, setPageCount] = useState<number>(1)
  const [hydrated, setHydrated] = useState(false)

  if (binder && !hydrated) {
    setName(binder.name)
    setDescription(binder.description ?? '')
    setColor(binder.color)
    setPageFormat(binder.page_format)
    setPageCount(binder.page_count)
    setHydrated(true)
  }

  if (isLoading) return <p className="p-8 text-gray-500">Chargement…</p>
  if (error) return <p className="p-8 text-red-600">Erreur : {(error as Error).message}</p>
  if (!binder) return <p className="p-8 text-gray-500">Classeur introuvable.</p>

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        color,
        page_format: pageFormat,
        page_count: pageCount,
      },
      {
        onSuccess: () => router.push(`/binders/${id}`),
      },
    )
  }

  function onDelete() {
    if (!binder) return
    if (!confirm(`Supprimer définitivement "${binder.name}" et toutes ses cartes ?`)) return
    del.mutate(id, {
      onSuccess: () => router.push('/binders'),
    })
  }

  return (
    <section className="mx-auto max-w-xl p-8">
      <div className="mb-6">
        <Link href={`/binders/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">Modifier le classeur</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Nom
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description (optionnel)
          </label>
          <textarea
            id="description"
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="color" className="text-sm font-medium">
            Couleur
          </label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <span className="font-mono text-sm text-gray-600">{color}</span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Format de page</label>
          <div className="flex gap-2">
            {([4, 8, 9, 12] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPageFormat(n)}
                className={`rounded border px-4 py-2 text-sm ${
                  pageFormat === n
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {n} cartes
              </button>
            ))}
          </div>
          {pageFormat !== binder.page_format && (
            <p className="mt-2 text-xs text-amber-700">
              ⚠ Changer le format peut laisser des cartes hors de la grille (slots &gt; {pageFormat}).
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pageCount" className="mb-1 block text-sm font-medium">
            Nombre de pages
          </label>
          <input
            id="pageCount"
            type="number"
            min={1}
            max={500}
            value={pageCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              setPageCount(Number.isFinite(v) && v >= 1 ? v : 1)
            }}
            className="w-32 rounded border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Réduire ce nombre n&apos;efface pas les cartes mais les rend inaccessibles.
          </p>
        </div>

        {update.error && (
          <p className="text-sm text-red-600">Erreur : {(update.error as Error).message}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={update.isPending || !name.trim()}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/binders/${id}`)}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
            >
              Annuler
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={del.isPending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {del.isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </form>
    </section>
  )
}
