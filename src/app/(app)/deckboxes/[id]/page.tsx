'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeckbox } from '@/hooks/useDeckboxes'
import { useDeckboxCards } from '@/hooks/useDeckboxCards'
import { useExternalCard } from '@/hooks/useExternalCard'
import { DeckboxCardDetailDialog } from '@/components/deckboxes/DeckboxCardDetailDialog'
import type { DeckboxCard } from '@/types/deckbox'
import type { GameType } from '@/types/card'

function CardRow({ card, onClick }: { card: DeckboxCard; onClick: () => void }) {
  const { data: external } = useExternalCard(card.game as GameType, card.card_id)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <td className="py-2 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
            {external?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={external.imageUrl}
                alt={external.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg">🃏</div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 leading-tight">
              {external?.name ?? card.card_id}
            </p>
            {external && (
              <p className="text-xs text-gray-400">
                {external.setCode} · {external.number}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-2 pr-4 text-sm text-gray-600 capitalize">{card.game}</td>
      <td className="py-2 pr-4 text-sm text-gray-600">{card.quantity}</td>
      <td className="py-2 pr-4 text-sm text-gray-600">{card.condition ?? '—'}</td>
      <td className="py-2 pr-4 text-sm text-gray-600">{card.is_foil ? 'Oui' : '—'}</td>
      <td className="py-2 text-sm text-gray-600">
        {card.selling_price != null ? `${card.selling_price.toFixed(2)} €` : '—'}
      </td>
    </tr>
  )
}

export default function DeckboxViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: deckbox, isLoading, error } = useDeckbox(id)
  const { data: cards, isLoading: cardsLoading } = useDeckboxCards(id)
  const [detailCard, setDetailCard] = useState<DeckboxCard | null>(null)

  if (isLoading) return <p className="p-8 text-gray-500">Chargement…</p>
  if (error) return <p className="p-8 text-red-600">Erreur : {(error as Error).message}</p>
  if (!deckbox) return <p className="p-8 text-gray-500">Deckbox introuvable.</p>

  return (
    <section className="mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <Link href="/deckboxes" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour
        </Link>
      </div>

      <header className="mb-6 flex items-start gap-4">
        <div
          className="mt-1 h-12 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: deckbox.color }}
          aria-hidden
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{deckbox.name}</h1>
          {deckbox.description && (
            <p className="mt-1 text-sm text-gray-600">{deckbox.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{cards?.length ?? 0} carte(s)</p>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push(`/search?deckboxId=${id}`)
          }
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Ajouter une carte
        </button>
        <Link
          href={`/deckboxes/${id}/edit`}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:border-gray-400"
        >
          Modifier
        </Link>
      </header>

      {cardsLoading ? (
        <p className="text-gray-500">Chargement des cartes…</p>
      ) : !cards?.length ? (
        <p className="text-gray-500">
          Aucune carte.{' '}
          <button
            type="button"
            onClick={() => router.push(`/search?deckboxId=${id}`)}
            className="underline hover:text-gray-700"
          >
            Ajouter depuis la recherche.
          </button>
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-4">Carte</th>
              <th className="pb-2 pr-4">Jeu</th>
              <th className="pb-2 pr-4">Qté</th>
              <th className="pb-2 pr-4">État</th>
              <th className="pb-2 pr-4">Foil</th>
              <th className="pb-2">Prix</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <CardRow key={c.id} card={c} onClick={() => setDetailCard(c)} />
            ))}
          </tbody>
        </table>
      )}

      <DeckboxCardDetailDialog
        deckboxId={id}
        card={detailCard}
        onClose={() => setDetailCard(null)}
      />
    </section>
  )
}
