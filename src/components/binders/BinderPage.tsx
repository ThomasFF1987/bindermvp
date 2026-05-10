'use client'

import { useState } from 'react'
import type { BinderCard, CardCondition } from '@/types/card'
import type { PageFormat } from '@/types/binder'
import { useExternalCard } from '@/hooks/useExternalCard'

const CONDITION_CODE: Record<CardCondition, string> = {
  mint: 'MT',
  near_mint: 'NM',
  excellent: 'EXC',
  good: 'GOOD',
  poor: 'BAD',
}

const GRID_CLASS: Record<PageFormat, string> = {
  4: 'grid-cols-2',
  8: 'grid-cols-4',
  9: 'grid-cols-3',
  12: 'grid-cols-4',
}

type Props = {
  pageFormat: PageFormat
  cards: BinderCard[]
  onSlotClick?: (slot: number) => void
  onCardClick?: (card: BinderCard) => void
  onCardRemove?: (card: BinderCard) => void
  onCardMove?: (cardId: string, toSlot: number) => void
  readOnly?: boolean
}

export function BinderPage({
  pageFormat,
  cards,
  onSlotClick,
  onCardClick,
  onCardRemove,
  onCardMove,
  readOnly = false,
}: Props) {
  const cardsBySlot = new Map<number, BinderCard>()
  for (const c of cards) cardsBySlot.set(c.slot, c)

  const slots = Array.from({ length: pageFormat }, (_, i) => i + 1)

  return (
    <div className={`grid gap-1.5 sm:gap-3 ${GRID_CLASS[pageFormat]}`}>
      {slots.map((slot) => {
        const card = cardsBySlot.get(slot)
        if (!card) {
          if (readOnly) {
            return (
              <div
                key={slot}
                className="aspect-[5/7] rounded-lg border border-dashed border-gray-200 bg-gray-50/40"
                aria-hidden
              />
            )
          }
          return <EmptySlot key={slot} slot={slot} onSlotClick={onSlotClick} onCardMove={onCardMove} />
        }
        return (
          <CardSlot
            key={slot}
            card={card}
            slot={slot}
            onClick={onCardClick}
            onRemove={onCardRemove}
            onCardMove={onCardMove}
            draggable={Boolean(onCardMove)}
          />
        )
      })}
    </div>
  )
}

function EmptySlot({
  slot,
  onSlotClick,
  onCardMove,
}: {
  slot: number
  onSlotClick?: (slot: number) => void
  onCardMove?: (cardId: string, toSlot: number) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  return (
    <button
      type="button"
      onClick={() => onSlotClick?.(slot)}
      onDragOver={(e) => {
        if (!onCardMove) return
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!onCardMove) return
        e.preventDefault()
        setDragOver(false)
        const cardId = e.dataTransfer.getData('text/plain')
        if (cardId) onCardMove(cardId, slot)
      }}
      className={`aspect-[5/7] rounded-lg border-2 border-dashed text-gray-400 transition ${
        dragOver
          ? 'border-black bg-gray-100 text-gray-700'
          : 'border-gray-300 hover:border-gray-400 hover:text-gray-600'
      }`}
    >
      <span className="text-3xl">+</span>
    </button>
  )
}

function CardSlot({
  card,
  slot,
  onClick,
  onRemove,
  onCardMove,
  draggable,
}: {
  card: BinderCard
  slot: number
  onClick?: (card: BinderCard) => void
  onRemove?: (card: BinderCard) => void
  onCardMove?: (cardId: string, toSlot: number) => void
  draggable: boolean
}) {
  const { data: external, isLoading } = useExternalCard(card.game, card.card_id)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="card-zoom group relative aspect-5/7 transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.08]">
    <div
      className={`card-float absolute inset-0 overflow-hidden rounded-lg border bg-gray-50 shadow-sm transition-shadow duration-300 hover:shadow-xl will-change-transform ${
        dragOver ? 'border-2 border-black ring-2 ring-black/30' : 'border border-gray-200'
      }`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return
        e.dataTransfer.setData('text/plain', card.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        if (!onCardMove) return
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (!onCardMove) return
        e.preventDefault()
        setDragOver(false)
        const draggedId = e.dataTransfer.getData('text/plain')
        if (!draggedId || draggedId === card.id) return
        onCardMove(draggedId, slot)
      }}
    >
      <button
        type="button"
        onClick={() => onClick?.(card)}
        className="block h-full w-full"
        title={external?.name ?? card.card_id}
      >
        {external?.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={external.imageUrl}
              alt={external.name}
              className="h-full w-full object-contain"
              loading="lazy"
              draggable={false}
              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }}
            />
            <div className="hidden h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 rounded-lg p-2">
              <span className="text-2xl">🃏</span>
              <span className="text-center text-[10px] text-gray-400 leading-tight">{external.name}</span>
            </div>
          </>
        ) : isLoading || !external ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-lg">
            <div className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 rounded-lg p-2">
            <span className="text-2xl">🃏</span>
            <span className="text-center text-[10px] text-gray-400 leading-tight">{external.name}</span>
          </div>
        )}
      </button>

      {card.is_foil && <span className="foil-overlay" aria-hidden />}

      {card.quantity > 1 && (
        <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          ×{card.quantity}
        </span>
      )}

      <div className="pointer-events-none absolute bottom-1 right-1 flex flex-col items-end gap-1">
        {card.condition && (
          <span className="rounded bg-gray-800/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {CONDITION_CODE[card.condition]}
          </span>
        )}
        {card.selling_price != null && (
          <span className="rounded bg-green-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {card.selling_price.toFixed(2)}€
          </span>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(card)}
          className="absolute right-1 top-1 z-10 hidden rounded bg-white px-1.5 py-0.5 text-xs text-red-600 shadow hover:bg-red-50 group-hover:block"
          aria-label="Retirer la carte"
        >
          ×
        </button>
      )}
    </div>
    </div>
  )
}
