'use client'

import { useState } from 'react'
import { useDeckboxes } from '@/hooks/useDeckboxes'
import { useAddDeckboxCard } from '@/hooks/useDeckboxCards'
import type { ExternalCard } from '@/types/card'

type Props = {
  card: ExternalCard | null
  onClose: () => void
  initialDeckboxId?: string
}

export function AddToDeckboxDialog({ card, onClose, initialDeckboxId }: Props) {
  const { data: deckboxes, isLoading } = useDeckboxes()
  const [deckboxId, setDeckboxId] = useState(initialDeckboxId ?? '')
  const [quantity, setQuantity] = useState('1')
  const addCard = useAddDeckboxCard(deckboxId)

  if (!card) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!card || !deckboxId) return
    const qty = parseInt(quantity, 10)
    addCard.mutate(
      { card_id: card.id, game: card.game, quantity: Number.isFinite(qty) && qty >= 1 ? qty : 1 },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajouter à une deckbox</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <p className="mb-4 truncate text-sm text-gray-600">{card.name}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="deckbox" className="mb-1 block text-sm font-medium">
              Deckbox
            </label>
            {isLoading ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : !deckboxes?.length ? (
              <p className="text-sm text-gray-500">Aucune deckbox. Créez-en une d&apos;abord.</p>
            ) : (
              <select
                id="deckbox"
                value={deckboxId}
                onChange={(e) => setDeckboxId(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value="">Choisir…</option>
                {deckboxes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="qty" className="mb-1 block text-sm font-medium">
              Quantité
            </label>
            <input
              id="qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {addCard.error && (
            <p className="text-sm text-red-600">Erreur : {(addCard.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addCard.isPending || !deckboxId}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {addCard.isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
