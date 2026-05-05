'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCreateBinder } from '@/hooks/useBinders'
import type { PageFormat } from '@/types/binder'

export default function NewBinderPage() {
  const router = useRouter()
  const create = useCreateBinder()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [pageFormat, setPageFormat] = useState<PageFormat>(9)
  const [pageCount, setPageCount] = useState<number>(1)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        color,
        page_format: pageFormat,
        page_count: pageCount,
      },
      {
        onSuccess: (binder) => router.push(`/binders/${binder.id}`),
      },
    )
  }

  return (
    <section className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Nouveau classeur</h1>

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
        </div>

        {create.error && (
          <p className="text-sm text-red-600">Erreur : {(create.error as Error).message}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={create.isPending || !name.trim()}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {create.isPending ? 'Création…' : 'Créer'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/binders')}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  )
}
