'use client'

import { useState } from 'react'
import { useUpdateCard, useDeleteCard } from '@/hooks/useCards'
import { useExternalCard } from '@/hooks/useExternalCard'
import type { BinderCard, CardCondition } from '@/types/card'

const CONDITIONS: { value: CardCondition; label: string }[] = [
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Bon' },
  { value: 'poor', label: 'Mauvais' },
]

type Props = {
  binderId: string
  card: BinderCard | null
  onClose: () => void
  readOnly?: boolean
}

export function CardDetailDialog({ binderId, card, onClose, readOnly = false }: Props) {
  const update = useUpdateCard(binderId)
  const del = useDeleteCard(binderId)
  const { data: external } = useExternalCard(card?.game ?? 'pokemon', card?.card_id ?? '')

  const [condition, setCondition] = useState<CardCondition | ''>('')
  const [isFoil, setIsFoil] = useState(false)
  const [sellingPrice, setSellingPrice] = useState<string>('')
  const [prevCardId, setPrevCardId] = useState<string | null>(null)

  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id)
    setCondition((card.condition ?? '') as CardCondition | '')
    setIsFoil(card.is_foil)
    setSellingPrice(card.selling_price != null ? String(card.selling_price) : '')
  }

  if (!card) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!card) return
    const priceNum = sellingPrice.trim() === '' ? null : Number(sellingPrice)
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      alert('Prix invalide')
      return
    }
    update.mutate(
      {
        cardId: card.id,
        input: {
          condition: condition === '' ? null : condition,
          is_foil: isFoil,
          selling_price: priceNum,
        },
      },
      { onSuccess: () => onClose() },
    )
  }

  function onDelete() {
    if (!card) return
    if (!confirm('Retirer cette carte du classeur ?')) return
    del.mutate(card.id, { onSuccess: () => onClose() })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start gap-3">
          <div className="relative h-32 w-auto overflow-hidden rounded">
            {external?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={external.imageUrlHiRes ?? external.imageUrl}
                alt={external.name}
                className="h-32 w-auto rounded object-contain"
              />
            ) : external ? (
              <div className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded bg-gray-100 p-2">
                <span className="text-2xl">🃏</span>
                <span className="text-center text-[10px] text-gray-400 leading-tight">{external.name}</span>
              </div>
            ) : (
              <div className="flex h-32 w-24 items-center justify-center rounded bg-gray-100">
                <div className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin" />
              </div>
            )}
            {isFoil && <span className="foil-overlay" aria-hidden />}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{external?.name ?? card.card_id}</h2>
            <p className="text-xs text-gray-500">
              {external?.setCode ?? '?'} · {external?.number ?? card.card_id}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Page {card.page_number}, slot {card.slot}
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

        {readOnly ? (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">État : </span>
              <span className="text-gray-700">
                {card.condition
                  ? CONDITIONS.find((c) => c.value === card.condition)?.label ?? card.condition
                  : 'Non précisé'}
              </span>
            </div>
            <div>
              <span className="font-medium">Foil : </span>
              <span className="text-gray-700">{card.is_foil ? 'Oui' : 'Non'}</span>
            </div>
            <div>
              <span className="font-medium">Prix de vente : </span>
              <span className="text-gray-700">
                {card.selling_price != null ? `${card.selling_price.toFixed(2)} €` : '—'}
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="condition" className="mb-1 block text-sm font-medium">
              État
            </label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as CardCondition | '')}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Non précisé</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFoil}
              onChange={(e) => setIsFoil(e.target.checked)}
            />
            Carte foil (effet visuel holographique)
          </label>

          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium">
              Prix de vente (€)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="—"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-32 rounded border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">Laisser vide si non à vendre.</p>
          </div>

          {update.error && (
            <p className="text-sm text-red-600">Erreur : {(update.error as Error).message}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={del.isPending}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              {del.isPending ? 'Retrait…' : 'Retirer du classeur'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
