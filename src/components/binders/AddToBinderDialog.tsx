'use client'

import { useMemo, useState } from 'react'
import { useBinders } from '@/hooks/useBinders'
import { useAddCard, useBinderCards } from '@/hooks/useCards'
import type { ExternalCard, GameType } from '@/types/card'
import type { PageFormat } from '@/types/binder'

const GRID_CLASS: Record<PageFormat, string> = {
  4: 'grid-cols-2',
  8: 'grid-cols-4',
  9: 'grid-cols-3',
  12: 'grid-cols-4',
}

type Props = {
  card: ExternalCard | null
  onClose: () => void
  initialBinderId?: string
  initialPage?: number
  initialSlot?: number
}

export function AddToBinderDialog({
  card,
  onClose,
  initialBinderId,
  initialPage,
  initialSlot,
}: Props) {
  const { data: binders } = useBinders()

  const [binderId, setBinderId] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [slot, setSlot] = useState<number | null>(null)
  const [prevCardId, setPrevCardId] = useState<string | null>(null)

  const currentCardId = card?.id ?? null
  if (currentCardId !== prevCardId) {
    setPrevCardId(currentCardId)
    setBinderId('')
    setPage(1)
    setSlot(null)
  }
  if (card && !binderId) {
    if (initialBinderId && binders?.some((b) => b.id === initialBinderId)) {
      setBinderId(initialBinderId)
      if (initialPage) setPage(initialPage)
      if (initialSlot) setSlot(initialSlot)
    } else if (binders && binders.length > 0) {
      setBinderId(binders[0].id)
    }
  }

  const binder = useMemo(
    () => binders?.find((b) => b.id === binderId),
    [binders, binderId],
  )
  const totalPages = binder?.page_count ?? 1
  const pageFormat = (binder?.page_format ?? 9) as PageFormat

  const { data: cards } = useBinderCards(binderId)
  const occupiedSlots = useMemo(() => {
    const set = new Set<number>()
    for (const c of cards ?? []) if (c.page_number === page) set.add(c.slot)
    return set
  }, [cards, page])

  const addCard = useAddCard(binderId)

  if (!card) return null

  const ownedBinders = binders ?? []

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!card || !binderId || slot == null) return
    addCard.mutate(
      {
        card_id: card.id,
        game: card.game as GameType,
        page_number: page,
        slot,
      },
      {
        onSuccess: () => onClose(),
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start gap-3">
          {card.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt={card.name}
              className="h-24 w-auto rounded"
            />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{card.name}</h2>
            <p className="text-xs text-gray-500">
              {card.setCode} · {card.number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        {ownedBinders.length === 0 ? (
          <p className="text-sm text-gray-600">
            Vous n&apos;avez aucun classeur. Créez-en un d&apos;abord.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="binder" className="mb-1 block text-sm font-medium">
                Classeur
              </label>
              <select
                id="binder"
                value={binderId}
                onChange={(e) => {
                  setBinderId(e.target.value)
                  setPage(1)
                  setSlot(null)
                }}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {ownedBinders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.page_format} cartes/page)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Page</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1))
                    setSlot(null)
                  }}
                  disabled={page <= 1}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
                >
                  ←
                </button>
                <span className="text-sm tabular-nums text-gray-700">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1))
                    setSlot(null)
                  }}
                  disabled={page >= totalPages}
                  className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Emplacement</label>
              <div className={`grid gap-2 ${GRID_CLASS[pageFormat]}`}>
                {Array.from({ length: pageFormat }, (_, i) => i + 1).map((s) => {
                  const occupied = occupiedSlots.has(s)
                  const selected = slot === s
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={occupied}
                      onClick={() => setSlot(s)}
                      className={`aspect-[5/7] rounded border-2 text-sm transition ${
                        selected
                          ? 'border-black bg-black text-white'
                          : occupied
                            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                            : 'border-dashed border-gray-300 hover:border-gray-500'
                      }`}
                      title={occupied ? 'Occupé' : `Slot ${s}`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {addCard.error && (
              <p className="text-sm text-red-600">
                Erreur : {(addCard.error as Error).message}
              </p>
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
                disabled={!binderId || slot == null || addCard.isPending}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {addCard.isPending ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
