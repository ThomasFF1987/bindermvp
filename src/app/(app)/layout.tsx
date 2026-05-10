import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { MessagesNavLink } from '@/components/messages/MessagesNavLink'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Binder
          </Link>
          <Link href="/binders" className="text-sm text-gray-600 hover:text-gray-900">
            Classeurs
          </Link>
          <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
            Recherche
          </Link>
          <MessagesNavLink />
          <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">
            Préférences
          </Link>
        </nav>
        <UserButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
