'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBinder, useUpdateBinder } from '@/hooks/useBinders'
import { useBinderCards, useDeleteCard, useMoveCard } from '@/hooks/useCards'
import { BinderPage } from '@/components/binders/BinderPage'
import { CardDetailDialog } from '@/components/binders/CardDetailDialog'
import { ShareDialog } from '@/components/binders/ShareDialog'
import type { BinderCard } from '@/types/card'

export default function BinderViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: binder, isLoading: binderLoading, error: binderError } = useBinder(id)
  const { data: cards, isLoading: cardsLoading } = useBinderCards(id)
  const deleteCard = useDeleteCard(id)
  const moveCard = useMoveCard(id)
  const updateBinder = useUpdateBinder(id)

  const [page, setPage] = useState(1)
  const [detailCard, setDetailCard] = useState<BinderCard | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const totalPages = binder?.page_count ?? 1
  const lastPageHasCards = useMemo(
    () => (cards ?? []).some((c) => c.page_number === totalPages),
    [cards, totalPages],
  )
  const canRemovePage = totalPages > 1 && !lastPageHasCards

  const cardsOnPage = useMemo<BinderCard[]>(
    () => (cards ?? []).filter((c) => c.page_number === page),
    [cards, page],
  )

  if (binderLoading) return <p className="p-8 text-gray-500">Chargement…</p>
  if (binderError) return <p className="p-8 text-red-600">Erreur : {(binderError as Error).message}</p>
  if (!binder) return <p className="p-8 text-gray-500">Classeur introuvable.</p>

  return (
    <section className="mx-auto max-w-5xl p-8">
      <div className="mb-6">
        <Link href="/binders" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </Link>
      </div>

      <header className="mb-6 flex items-start gap-4">
        <div
          className="mt-1 h-12 w-2 rounded-full"
          style={{ backgroundColor: binder.color }}
          aria-hidden
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{binder.name}</h1>
          {binder.description && (
            <p className="mt-1 text-sm text-gray-600">{binder.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {binder.page_format} cartes / page · {cards?.length ?? 0} carte(s)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-400"
        >
          {binder.share_token ? 'Lien partagé' : 'Partager'}
        </button>
        <Link
          href={`/binders/${binder.id}/edit`}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-400"
        >
          Modifier
        </Link>
      </header>

      

      {cardsLoading ? (
        <p className="text-gray-500">Chargement des cartes…</p>
      ) : (
        <>
          <div className="flex items-stretch gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              onDragEnter={(e) => {
                e.preventDefault()
                setPage((p) => Math.max(1, p - 1))
              }}
              onDragOver={(e) => e.preventDefault()}
              disabled={page <= 1}
              className="flex w-12 shrink-0 items-center justify-center rounded border border-gray-300 text-2xl text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30"
              title="Page précédente (déposez une carte ici pour basculer)"
              aria-label="Page précédente"
            >
              ←
            </button>

            <div className="flex-1">
              <BinderPage
                pageFormat={binder.page_format}
                cards={cardsOnPage}
                onSlotClick={(slot) => {
                  const qs = new URLSearchParams({
                    binderId: id,
                    page: String(page),
                    slot: String(slot),
                  })
                  router.push(`/search?${qs.toString()}`)
                }}
                onCardClick={(card) => setDetailCard(card)}
                onCardRemove={(card) => {
                  if (confirm(`Retirer ${card.card_id} ?`)) deleteCard.mutate(card.id)
                }}
                onCardMove={(cardId, toSlot) => {
                  moveCard.mutate({ cardId, toPage: page, toSlot })
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              onDragEnter={(e) => {
                e.preventDefault()
                setPage((p) => Math.min(totalPages, p + 1))
              }}
              onDragOver={(e) => e.preventDefault()}
              disabled={page >= totalPages}
              className="flex w-12 shrink-0 items-center justify-center rounded border border-gray-300 text-2xl text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30"
              title="Page suivante (déposez une carte ici pour basculer)"
              aria-label="Page suivante"
            >
              →
            </button>
          </div>
              
          <div className="mt-4 text-center text-sm tabular-nums text-gray-700">
            Page {page} / {totalPages}
          </div>
        </>
      )}

      <CardDetailDialog
        binderId={id}
        card={detailCard}
        onClose={() => setDetailCard(null)}
      />

      {shareOpen && (
        <ShareDialog
          binderId={id}
          shareToken={binder.share_token ?? null}
          onClose={() => setShareOpen(false)}
        />
      )}
    </section>
  )
}
