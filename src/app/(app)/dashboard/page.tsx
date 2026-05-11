'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

const FEATURES = [
  {
    title: 'Classeurs',
    description: 'Organisez vos cartes en pages de 4, 8, 9 ou 12 emplacements. Personnalisez la couleur et partagez via un lien unique.',
    icon: '📚',
    href: '/collection?tab=binders',
    cta: 'Voir mes classeurs',
  },
  {
    title: 'Deckboxes',
    description: 'Rangez vos cartes dans une liste simple sans contrainte de page ni d\'emplacement. Idéal pour les decks et les want-lists.',
    icon: '🗃️',
    href: '/collection?tab=deckboxes',
    cta: 'Voir mes deckboxes',
  },
  {
    title: 'Recherche',
    description: 'Trouvez des cartes Pokémon, Final Fantasy TCG et bien d\'autres jeux pour les ajouter à vos classeurs ou deckboxes.',
    icon: '🔍',
    href: '/search',
    cta: 'Rechercher des cartes',
  },
  {
    title: 'Messages',
    description: 'Partagez vos classeurs publiquement via un lien unique et échangez avec la communauté de collectionneurs.',
    icon: '💬',
    href: '/messages',
    cta: 'Voir les messages',
  },
]

export default function DashboardPage() {
  const { user } = useUser()
  const prenom = user?.firstName ?? 'Collectionneur'

  return (
    <main
      className="min-h-screen p-8 md:p-16"
      style={{ background: 'linear-gradient(135deg, #161616 0%, #1e1e1e 100%)' }}
    >
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
          Bienvenue, {prenom} 👋
        </h1>
        <p className="mx-auto max-w-xl text-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Gérez votre collection de cartes à collectionner depuis un seul endroit.
        </p>
      </section>

      {/* Feature cards */}
      <section className="mx-auto mb-16 grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group flex flex-col gap-4 rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="text-4xl">{f.icon}</span>
            <h2 className="text-xl font-semibold text-white">{f.title}</h2>
            <p className="flex-1 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {f.description}
            </p>
            <span
              className="text-sm font-medium transition-opacity duration-200 group-hover:opacity-100"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {f.cta} →
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}
