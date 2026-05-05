'use client'

import Link from 'next/link'
import { useBinders, useDeleteBinder } from '@/hooks/useBinders'

export default function BindersPage() {
  const { data: binders, isLoading, error } = useBinders()
  const del = useDeleteBinder()

  return (
    <section className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes classeurs</h1>
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
              {/* Ombre portée du classeur posé */}
              <div
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-3 rounded-full bg-black/20 blur-md transition group-hover:bg-black/30"
              />

              {/* Corps du classeur */}
              <div
                className="relative aspect-[3/4] overflow-hidden rounded-r-md rounded-l-sm shadow-lg transition group-hover:-translate-y-1 group-hover:shadow-2xl"
                style={{
                  backgroundColor: b.color,
                  backgroundImage:
                    'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 6%, rgba(255,255,255,0.08) 14%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.15) 100%)',
                }}
              >
                {/* Tranche / reliure à gauche */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-8 border-r border-black/30"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.4) 100%)',
                  }}
                />

                {/* Reflet vertical */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-1/3"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 60%, rgba(255,255,255,0) 100%)',
                  }}
                />

                {/* Étiquette */}
                <Link
                  href={`/binders/${b.id}`}
                  className="absolute inset-x-4 left-12 top-10 block rounded-sm bg-white/95 px-4 py-3 shadow-md ring-1 ring-black/10 transition hover:bg-white"
                >
                  <h2 className="line-clamp-2 font-semibold text-gray-900">{b.name}</h2>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{b.description}</p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                    {b.page_format} cartes / page
                  </p>
                </Link>

                {/* Bouton supprimer en bas */}
                <button
                  onClick={() => {
                    if (confirm(`Supprimer "${b.name}" ?`)) del.mutate(b.id)
                  }}
                  disabled={del.isPending}
                  className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-xs text-red-600 opacity-0 shadow ring-1 ring-black/10 transition hover:bg-white group-hover:opacity-100 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
