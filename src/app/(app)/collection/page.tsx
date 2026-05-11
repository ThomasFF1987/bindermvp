'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useId } from 'react'
import { useBinders, useDeleteBinder } from '@/hooks/useBinders'
import { useDeckboxes, useDeleteDeckbox } from '@/hooks/useDeckboxes'

export default function CollectionPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Chargement…</p>}>
      <CollectionPageInner />
    </Suspense>
  )
}

function CollectionPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') ?? 'binders') as 'binders' | 'deckboxes'

  return (
    <section className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Ma collection</h1>

      {/* Onglets */}
      <div className="mb-6 flex items-center gap-1 border-b border-gray-200">
        {(['binders', 'deckboxes'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => router.replace(`/collection?tab=${t}`)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'binders' ? 'Classeurs' : 'Deckboxes'}
          </button>
        ))}
      </div>

      {tab === 'binders' ? <BindersTab /> : <DeckboxesTab />}
    </section>
  )
}

function BindersTab() {
  const { data: binders, isLoading, error } = useBinders()
  const del = useDeleteBinder()

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link
          href="/binders/new"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nouveau classeur
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {(error as Error).message}</p>}

      {binders && binders.length === 0 && (
        <p className="text-gray-500">Aucun classeur. Créez-en un pour commencer.</p>
      )}

      {binders && binders.length > 0 && (
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {binders.map((b) => (
            <li key={b.id} className="group relative">
              <div
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-black/20 blur-md transition group-hover:bg-black/30"
              />
              <Link
                href={`/binders/${b.id}`}
                className="relative block aspect-3/4 overflow-hidden rounded-r-md rounded-l-sm shadow-lg transition group-hover:-translate-y-1 group-hover:shadow-2xl"
                style={{
                  backgroundColor: b.color,
                  backgroundImage:
                    'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 6%, rgba(255,255,255,0.08) 14%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.15) 100%)',
                }}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-8 border-r border-black/30"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.4) 100%)',
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0) 100%)',
                  }}
                />
                <div className="absolute inset-x-4 left-12 top-10 rounded-sm bg-white/95 px-4 py-3 shadow-md ring-1 ring-black/10">
                  <h2 className="line-clamp-2 font-semibold text-gray-900">{b.name}</h2>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{b.description}</p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                    {b.page_format} cartes / page
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    if (confirm(`Supprimer "${b.name}" ?`)) del.mutate(b.id)
                  }}
                  disabled={del.isPending}
                  className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-xs text-red-600 opacity-0 shadow ring-1 ring-black/10 transition hover:bg-white group-hover:opacity-100 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DeckboxVisual({ color, name, description }: { color: string; name: string; description: string | null }) {
  const rawId = useId().replace(/[:]/g, '')
  const idTop   = `dbTop-${rawId}`
  const idFront = `dbFront-${rawId}`
  const idSide  = `dbSide-${rawId}`
  const idLid   = `dbLid-${rawId}`

  const lighter = `color-mix(in srgb, ${color} 65%, #fff)`
  const light   = `color-mix(in srgb, ${color} 85%, #fff)`
  const darker  = `color-mix(in srgb, ${color} 65%, #000)`
  const darkest = `color-mix(in srgb, ${color} 35%, #000)`

  /* Géométrie du box : viewBox 100×110, profondeur D = (15,18). */
  return (
    <div
      className="relative mx-auto transition-transform duration-200 group-hover:-translate-y-1"
      style={{ width: '75%', aspectRatio: '100 / 100' }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'drop-shadow(5px 9px 14px rgba(0,0,0,0.4))' }}
      >
        <defs>
          {/* Dessus : très éclairé */}
          <linearGradient id={idTop} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={lighter} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          {/* Face avant : couleur dominante avec léger dégradé */}
          <linearGradient id={idFront} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={light} />
            <stop offset="40%"  stopColor={color} />
            <stop offset="100%" stopColor={darker} />
          </linearGradient>
          {/* Côté droit : sombre */}
          <linearGradient id={idSide} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={darker} />
            <stop offset="100%" stopColor={darkest} />
          </linearGradient>
          {/* Couvercle (bande supérieure du front) */}
          <linearGradient id={idLid} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={lighter} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Côté droit (profondeur 3D) */}
        <polygon
          points="85,18 100,0 100,82 85,100"
          fill={`url(#${idSide})`}
          stroke={darkest}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Dessus du box */}
        <polygon
          points="15,0 100,0 85,18 0,18"
          fill={`url(#${idTop})`}
          stroke={darkest}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Face avant complète */}
        <rect
          x="0" y="18" width="85" height="82"
          fill={`url(#${idFront})`}
          stroke={darkest}
          strokeWidth="0.5"
        />

        {/* Couvercle / flap magnétique : bande supérieure du front (un peu plus claire) */}
        <rect
          x="0" y="18" width="85" height="22"
          fill={`url(#${idLid})`}
          opacity="0.55"
        />
        {/* Côté du flap (continuation sur la tranche) */}
        <polygon
          points="85,18 100,0 100,22 85,40"
          fill={lighter}
          opacity="0.35"
        />

        {/* Ligne de séparation flap/corps — face avant */}
        <line x1="0" y1="40" x2="85" y2="40" stroke={darkest} strokeWidth="0.7" opacity="0.75" />
        {/* Ligne de séparation flap/corps — côté droit (en perspective) */}
        <line x1="85" y1="40" x2="100" y2="22" stroke={darkest} strokeWidth="0.7" opacity="0.75" />

        {/* Petit pictogramme magnétique au centre du flap */}
        <rect
          x="38" y="26" width="9" height="3.5"
          rx="1.5"
          fill={lighter}
          stroke={darkest}
          strokeWidth="0.3"
          opacity="0.7"
        />

        {/* Détail bas : 3 petits losanges (logo) */}
        <g fill="white" opacity="0.25">
          <circle cx="38" cy="92" r="1.2" />
          <circle cx="44" cy="92" r="1.2" />
          <circle cx="50" cy="92" r="1.2" />
        </g>
      </svg>

      {/* Étiquette HTML positionnée sur la face avant, sous le flap */}
      <div
        className="absolute"
        style={{
          left: '9%',
          width: '65%',
          top: '50%',
          background: 'rgba(255,255,255,0.96)',
          borderRadius: '3px',
          padding: '6px 8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <p className="line-clamp-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-900 leading-tight">
          {name}
        </p>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-center text-[9px] text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function DeckboxesTab() {
  const { data: deckboxes, isLoading, error } = useDeckboxes()
  const del = useDeleteDeckbox()

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Link
          href="/deckboxes/new"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nouvelle deckbox
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Chargement…</p>}
      {error && <p className="text-red-600">Erreur : {(error as Error).message}</p>}

      {deckboxes && deckboxes.length === 0 && (
        <p className="text-gray-500">Aucune deckbox. Créez-en une pour commencer.</p>
      )}

      {deckboxes && deckboxes.length > 0 && (
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {deckboxes.map((d) => (
            <li key={d.id} className="group relative">
              {/* Ombre portée */}
              <div
                aria-hidden
                className="absolute inset-x-4 bottom-0 h-3 rounded-full blur-md transition group-hover:opacity-80"
                style={{ backgroundColor: d.color, opacity: 0.35 }}
              />
              <Link href={`/deckboxes/${d.id}`} className="relative block">
                <DeckboxVisual color={d.color} name={d.name} description={d.description} />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm(`Supprimer "${d.name}" ?`)) del.mutate(d.id)
                }}
                disabled={del.isPending}
                className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-xs text-red-600 opacity-0 shadow ring-1 ring-black/10 transition hover:bg-white group-hover:opacity-100 disabled:opacity-50"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
