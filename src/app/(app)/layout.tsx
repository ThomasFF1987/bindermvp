'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { MessagesNavLink } from '@/components/messages/MessagesNavLink'
import { useTheme } from '@/context/ThemeContext'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { accent } = useTheme()

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6"
        style={{
          height: '60px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight"
            style={{ color: accent, transition: 'color 0.3s ease' }}
          >
            BINDER
          </Link>
          <NavLink href="/collection">Ma collection</NavLink>
          <NavLink href="/search">Recherche</NavLink>
          <MessagesNavLink />
          <NavLink href="/settings">Préférences</NavLink>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {children}
    </Link>
  )
}
