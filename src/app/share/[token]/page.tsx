'use client'

import { use, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BinderPage } from '@/components/binders/BinderPage'
import { CardDetailDialog } from '@/components/binders/CardDetailDialog'
import type { Binder } from '@/types/binder'
import type { BinderCard } from '@/types/card'

type SharePayload = { binder: Binder; cards: BinderCard[]; owner: { name: string } | null }
type ApiResponse<T> = { data: T | null; error: { message?: string } | null }

async function fetchShare(token: string): Promise<SharePayload> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}`)
  const json = (await res.json()) as ApiResponse<SharePayload>
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data
}

export default function SharedBinderPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const { data, isLoading, error } = useQuery({
    queryKey: ['share', token],
    queryFn: () => fetchShare(token),
    staleTime: 60 * 1000,
  })

  const [page, setPage] = useState(1)
  const [detailCard, setDetailCard] = useState<BinderCard | null>(null)

  const binder = data?.binder
  const cards = useMemo(() => data?.cards ?? [], [data?.cards])
  const owner = data?.owner ?? null
  const totalPages = binder?.page_count ?? 1

  const cardsOnPage = useMemo<BinderCard[]>(
    () => cards.filter((c) => c.page_number === page),
    [cards, page],
  )

  if (isLoading) return <p className="p-8 text-gray-500">Chargement…</p>
  if (error || !binder) {
    return (
      <section className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">Classeur introuvable</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ce lien de partage est invalide ou a été révoqué.
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl p-3 sm:p-6 lg:p-8">
      <header className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
        <div
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full sm:h-12 sm:w-2"
          style={{ backgroundColor: binder.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {owner && (
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Classeur de {owner.name}
            </p>
          )}
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{binder.name}</h1>
          {binder.description && (
            <p className="mt-1 text-sm text-gray-600">{binder.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {binder.page_format} cartes / page · {cards.length} carte(s) · vue partagée (lecture seule)
          </p>
        </div>
      </header>

      <div className="flex items-stretch gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex w-7 shrink-0 items-center justify-center rounded border border-gray-300 text-xl text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30 sm:w-12 sm:text-2xl"
          aria-label="Page précédente"
        >
          ←
        </button>

        <div className="min-w-0 flex-1">
          <BinderPage
            pageFormat={binder.page_format}
            cards={cardsOnPage}
            onCardClick={(card) => setDetailCard(card)}
            readOnly
          />
        </div>

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex w-7 shrink-0 items-center justify-center rounded border border-gray-300 text-xl text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:opacity-30 sm:w-12 sm:text-2xl"
          aria-label="Page suivante"
        >
          →
        </button>
      </div>

      <div className="mt-4 text-center text-sm tabular-nums text-gray-700">
        Page {page} / {totalPages}
      </div>

      <CardDetailDialog
        binderId={binder.id}
        card={detailCard}
        onClose={() => setDetailCard(null)}
        readOnly
      />
    </section>
  )
}
