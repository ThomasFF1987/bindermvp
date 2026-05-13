'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCardSearch } from '@/hooks/useCardSearch'
import { useCardSets } from '@/hooks/useCardSets'
import { useSearchLang } from '@/context/SearchLangContext'
import { SEARCH_LANGS, SEARCH_LANG_CODES, getLang } from '@/lib/langs'
import type { ExternalCard, GameType } from '@/types/card'
import { AddToBinderDialog } from '@/components/binders/AddToBinderDialog'
import { AddToDeckboxDialog } from '@/components/deckboxes/AddToDeckboxDialog'

const T = {
  fr: {
    title: 'Recherche de cartes',
    game: 'Jeu',
    languages: 'Langues',
    selectAll: 'Tout',
    selectNone: 'Aucune',
    extension: 'Extension',
    allExtensions: 'Toutes les extensions',
    cardName: 'Nom de la carte',
    placeholder: 'ex. pikachu, charizard ex…',
    search: 'Rechercher',
    hint: 'Saisissez un nom de carte ou sélectionnez une extension.',
    noResult: (q: string) => `Aucun résultat pour « ${q} ».`,
    results: (n: number) => `${n} résultat(s)`,
    loading: '· chargement…',
    page: (p: number, t: number) => `Page ${p} / ${t}`,
    addBinder: '+ Classeur',
    addDeckbox: '+ Deckbox',
    noImage: "Pas d'image",
    soon: ' (à venir)',
    error: 'Erreur :',
    searching: 'Recherche en cours…',
  },
  en: {
    title: 'Card Search',
    game: 'Game',
    languages: 'Languages',
    selectAll: 'All',
    selectNone: 'None',
    extension: 'Set',
    allExtensions: 'All sets',
    cardName: 'Card name',
    placeholder: 'e.g. pikachu, charizard ex…',
    search: 'Search',
    hint: 'Enter a card name or select a set.',
    noResult: (q: string) => `No results for "${q}".`,
    results: (n: number) => `${n} result(s)`,
    loading: '· loading…',
    page: (p: number, t: number) => `Page ${p} / ${t}`,
    addBinder: '+ Binder',
    addDeckbox: '+ Deckbox',
    noImage: 'No image',
    soon: ' (coming soon)',
    error: 'Error:',
    searching: 'Searching…',
  },
} as const

const GAMES: { value: GameType; label: string; disabled?: boolean }[] = [
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'finalfantasy', label: 'Final Fantasy TCG' },
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
  const { lang } = useSearchLang()
  const t = T[lang]
  const [game, setGame] = useState<GameType>('pokemon')
  const [searchLangs, setSearchLangs] = useState<string[]>(SEARCH_LANG_CODES)
  const isMultiLang = game !== 'finalfantasy'
  const effectiveLangs = isMultiLang ? searchLangs : ['en']
  const [setCode, setSetCode] = useState('')
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState<ExternalCard | null>(null)
  const [addingToDeckbox, setAddingToDeckbox] = useState<ExternalCard | null>(null)

  const { data: sets, isLoading: setsLoading } = useCardSets(game, lang)
  const searchParams = useSearchParams()
  const presetBinderId = searchParams.get('binderId') ?? undefined
  const presetDeckboxId = searchParams.get('deckboxId') ?? undefined
  const presetPage = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined
  const presetSlot = searchParams.get('slot') ? parseInt(searchParams.get('slot')!, 10) : undefined

  const { data, isFetching, isError, error, isPlaceholderData } = useCardSearch(
    game,
    submitted,
    page,
    true,
    setCode || undefined,
    effectiveLangs,
  )

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(input.trim())
    setPage(1)
  }

  return (
    <section className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{t.title}</h1>

      <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="game" className="mb-1 block text-sm font-medium">
            {t.game}
          </label>
          <select
            id="game"
            value={game}
            onChange={(e) => {
              setGame(e.target.value as GameType)
              setSetCode('')
              setPage(1)
            }}
            className="rounded border border-gray-300 px-3 py-2"
          >
            {GAMES.map((g) => (
              <option key={g.value} value={g.value} disabled={g.disabled}>
                {g.label}
                {g.disabled ? t.soon : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="setCode" className="mb-1 block text-sm font-medium">
            {t.extension}
          </label>
          <select
            id="setCode"
            value={setCode}
            onChange={(e) => { setSetCode(e.target.value); setPage(1) }}
            disabled={setsLoading || undefined}
            suppressHydrationWarning
            className="rounded border border-gray-300 px-3 py-2 disabled:opacity-50"
          >
            <option value="">{t.allExtensions}</option>
            {sets?.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            {t.cardName}
          </label>
          <input
            id="q"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={isFetching}
          suppressHydrationWarning
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {t.search}
        </button>
      </form>

      {isMultiLang && (
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-sm font-medium">{t.languages}</span>
          <button
            type="button"
            onClick={() => { setSearchLangs(SEARCH_LANG_CODES); setPage(1) }}
            className="text-xs text-gray-600 hover:underline"
          >
            {t.selectAll}
          </button>
          <button
            type="button"
            onClick={() => { setSearchLangs([]); setPage(1) }}
            className="text-xs text-gray-600 hover:underline"
          >
            {t.selectNone}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {SEARCH_LANGS.map((l) => {
            const checked = searchLangs.includes(l.code)
            return (
              <label
                key={l.code}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                  checked ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => {
                    setSearchLangs((prev) =>
                      e.target.checked ? [...prev, l.code] : prev.filter((c) => c !== l.code),
                    )
                    setPage(1)
                  }}
                />
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </label>
            )
          })}
        </div>
      </div>
      )}

      {isError && (
        <p className="mb-4 text-sm text-red-600">{t.error} {(error as Error).message}</p>
      )}

      {isFetching && (
        <p className="text-gray-500 animate-pulse">{t.searching}</p>
      )}

      {!isFetching && !submitted && !setCode && <p className="text-gray-500">{t.hint}</p>}

      {submitted && data && data.items.length === 0 && !isFetching && (
        <p className="text-gray-500">{t.noResult(submitted)}</p>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            {t.results(data.totalCount)} {isFetching && t.loading}
          </p>
          <ul
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
              isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {data.items.map((c) => {
              const langInfo = getLang(c.lang)
              return (
              <li
                key={`${c.id}::${c.lang ?? 'unknown'}`}
                className="group relative flex flex-col rounded-lg border border-gray-200 p-2 text-center shadow-sm"
              >
                <div className="relative mb-2">
                {c.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="mx-auto aspect-[5/7] w-full rounded object-contain"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden') }}
                    />
                    <div className="hidden aspect-[5/7] w-full rounded bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
                      <span className="text-2xl">🃏</span>
                      <span className="text-center text-[10px] text-gray-400 leading-tight">{t.noImage}</span>
                    </div>
                  </>
                ) : (
                  <div className="aspect-[5/7] w-full rounded bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
                    <span className="text-2xl">🃏</span>
                    <span className="text-center text-[10px] text-gray-400 leading-tight">{t.noImage}</span>
                  </div>
                )}
                {langInfo && (
                  <span
                    title={langInfo.label}
                    className="absolute bottom-1 right-1 rounded-full bg-white/90 px-1.5 py-0.5 text-xs shadow ring-1 ring-black/10"
                  >
                    {langInfo.flag}
                  </span>
                )}
                </div>
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-gray-500">{c.number}</p>
                <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-col gap-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
                  {!presetDeckboxId && (
                    <button
                      type="button"
                      onClick={() => setAdding(c)}
                      className="rounded bg-black px-2 py-1 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      {t.addBinder}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAddingToDeckbox(c)}
                    className={`rounded ${presetDeckboxId ? 'bg-black text-white hover:bg-gray-800' : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'} px-2 py-1 text-xs font-medium`}
                  >
                    {t.addDeckbox}
                  </button>
                </div>
              </li>
              )
            })}
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
              {t.page(page, totalPages)}
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
      <AddToDeckboxDialog
        card={addingToDeckbox}
        onClose={() => setAddingToDeckbox(null)}
        initialDeckboxId={presetDeckboxId}
      />
    </section>
  )
}
