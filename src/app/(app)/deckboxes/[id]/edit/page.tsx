'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDeckbox, useDeleteDeckbox, useUpdateDeckbox } from '@/hooks/useDeckboxes'

export default function EditDeckboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: deckbox, isLoading, error } = useDeckbox(id)
  const update = useUpdateDeckbox(id)
  const del = useDeleteDeckbox()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [hydrated, setHydrated] = useState(false)

  if (deckbox && !hydrated) {
    setName(deckbox.name)
    setDescription(deckbox.description ?? '')
    setColor(deckbox.color)
    setHydrated(true)
  }

  if (isLoading) return <p className="p-8 text-gray-500">Chargement…</p>
  if (error) return <p className="p-8 text-red-600">Erreur : {(error as Error).message}</p>
  if (!deckbox) return <p className="p-8 text-gray-500">Deckbox introuvable.</p>

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(
      { name: name.trim(), description: description.trim() || null, color },
      { onSuccess: () => router.push(`/deckboxes/${id}`) },
    )
  }

  function onDelete() {
    if (!deckbox) return
    if (!confirm(`Supprimer définitivement "${deckbox.name}" et toutes ses cartes ?`)) return
    del.mutate(id, { onSuccess: () => router.push('/deckboxes') })
  }

  return (
    <section className="mx-auto max-w-xl p-8">
      <div className="mb-6">
        <Link href={`/deckboxes/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">Modifier la deckbox</h1>

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
              onClick={() => router.push(`/deckboxes/${id}`)}
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
