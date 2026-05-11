'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCreateDeckbox } from '@/hooks/useDeckboxes'

export default function NewDeckboxPage() {
  const router = useRouter()
  const create = useCreateDeckbox()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(
      { name: name.trim(), description: description.trim() || null, color },
      { onSuccess: (deckbox) => router.push(`/deckboxes/${deckbox.id}`) },
    )
  }

  return (
    <section className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle deckbox</h1>

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
            onClick={() => router.push('/deckboxes')}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  )
}
