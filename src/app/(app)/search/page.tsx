'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCardSearch } from '@/hooks/useCardSearch'
import type { ExternalCard, GameType } from '@/types/card'
import { AddToBinderDialog } from '@/components/binders/AddToBinderDialog'

const GAMES: { value: GameType; label: string; disabled?: boolean }[] = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'magic', label: 'Magic', disabled: true },
  { value: 'dragonball', label: 'Dragon Ball', disabled: true },
  { value: 'swu', label: 'Star Wars Unlimited', disabled: true },
]

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Chargement…</p>}>
      <SearchPageInner />
    </Suspense>
  )
}

function SearchPageInner() {
  const [game, setGame] = useState<GameType>('pokemon')
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState<ExternalCard | null>(null)
  const searchParams = useSearchParams()
  const presetBinderId = searchParams.get('binderId') ?? undefined
  const presetPage = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
  const presetSlot = searchParams.get('slot') ? parseInt(searchParams.get('slot')!, 10) : undefined

  const { data, isFetching, isError, error, isPlaceholderData } = useCardSearch(
    game,
    submitted,
    page,
    true,
  )

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(input.trim())
    setPage(1)
  }

  return (
    <section className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Recherche de cartes</h1>

      <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="game" className="mb-1 block text-sm font-medium">
            Jeu
          </label>
          <select
            id="game"
            value={game}
            onChange={(e) => {
              setGame(e.target.value as GameType)
              setPage(1)
            }}
            className="rounded border border-gray-300 px-3 py-2"
          >
            {GAMES.map((g) => (
              <option key={g.value} value={g.value} disabled={g.disabled}>
                {g.label}
                {g.disabled ? ' (à venir)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Nom de la carte
          </label>
          <input
            id="q"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ex. pikachu, charizard ex…"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          suppressHydrationWarning
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Rechercher
        </button>
      </form>

      {isError && (
        <p className="mb-4 text-sm text-red-600">Erreur : {(error as Error).message}</p>
      )}

      {!submitted && <p className="text-gray-500">Saisissez un nom de carte.</p>}

      {submitted && data && data.items.length === 0 && !isFetching && (
        <p className="text-gray-500">Aucun résultat pour « {submitted} ».</p>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {data.totalCount} résultat(s) {isFetching && '· chargement…'}
          </p>
          <ul
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
              isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {data.items.map((c) => (
              <li
                key={c.id}
                className="flex flex-col rounded-lg border border-gray-200 p-2 text-center shadow-sm"
              >
                {c.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="mx-auto mb-2 aspect-[5/7] w-full rounded object-contain"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }}
                    />
                    <div className="hidden mb-2 aspect-[5/7] w-full rounded bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
                      <span className="text-2xl">🃏</span>
                      <span className="text-center text-[10px] text-gray-400 leading-tight">Pas d&apos;image</span>
                    </div>
                  </>
                ) : (
                  <div className="mb-2 aspect-[5/7] w-full rounded bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
                    <span className="text-2xl">🃏</span>
                    <span className="text-center text-[10px] text-gray-400 leading-tight">Pas d&apos;image</span>
                  </div>
                )}
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {c.setName} · {c.number}
                </p>
                {c.rarity && (
                  <p className="truncate text-[10px] uppercase text-gray-400">{c.rarity}</p>
                )}
                <button
                  type="button"
                  onClick={() => setAdding(c)}
                  className="mt-2 rounded bg-black px-2 py-1 text-xs font-medium text-white hover:bg-gray-800"
                >
                  + Ajouter au classeur
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              ←
            </button>
            <span className="text-sm tabular-nums text-gray-700">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
            >
              →
            </button>
          </div>
        </>
      )}

      <AddToBinderDialog
        card={adding}
        onClose={() => setAdding(null)}
        initialBinderId={presetBinderId}
        initialPage={presetPage}
        initialSlot={presetSlot}
      />
    </section>
  )
}
