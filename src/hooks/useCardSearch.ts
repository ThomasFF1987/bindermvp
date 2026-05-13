'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { CardSearchResult, GameType } from '@/types/card'

type ApiResponse<T> = { data: T | null; error: { message?: string } | null }

async function search(game: GameType, q: string, page: number, setCode?: string, langs?: string[]): Promise<CardSearchResult> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: '20' })
  if (setCode) params.set('setCode', setCode)
  if (langs && langs.length > 0) params.set('langs', langs.join(','))
  const res = await fetch(`/api/search/${game}?${params}`)
  const json = (await res.json()) as ApiResponse<CardSearchResult>
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data
}

export function useCardSearch(game: GameType, q: string, page: number, enabled: boolean, setCode?: string, langs?: string[]) {
  const langsKey = langs ? [...langs].sort().join(',') : ''
  return useQuery({
    queryKey: ['search', game, q, page, setCode, langsKey],
    queryFn: () => search(game, q, page, setCode, langs),
    enabled: enabled && (q.trim().length > 0 || !!setCode) && (!langs || langs.length > 0),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
