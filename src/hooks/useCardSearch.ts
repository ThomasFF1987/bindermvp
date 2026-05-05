'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import type { CardSearchResult, GameType } from '@/types/card'

type ApiResponse<T> = { data: T | null; error: { message?: string } | null }

async function search(game: GameType, q: string, page: number): Promise<CardSearchResult> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: '20' })
  const res = await fetch(`/api/search/${game}?${params}`)
  const json = (await res.json()) as ApiResponse<CardSearchResult>
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data
}

export function useCardSearch(game: GameType, q: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: ['search', game, q, page],
    queryFn: () => search(game, q, page),
    enabled: enabled && q.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
