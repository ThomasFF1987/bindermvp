'use client'

import Link from 'next/link'
import { useUnreadCount } from '@/hooks/useMessages'

export function MessagesNavLink() {
  const { data } = useUnreadCount()
  const count = data?.count ?? 0
  return (
    <Link
      href="/messages"
      className="relative flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
    >
      Messages
      {count > 0 && (
        <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
