'use client'

import { useQuery } from '@tanstack/react-query'
import type { GameType } from '@/types/card'
import type { CardSet } from '@/lib/adapters/types'

type ApiResponse<T> = { data: T | null; error: { message?: string } | null }

async function fetchSets(game: GameType, lang: string): Promise<CardSet[]> {
  const res = await fetch(`/api/sets/${game}?lang=${lang}`)
  const json = (await res.json()) as ApiResponse<CardSet[]>
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data
}

export function useCardSets(game: GameType | null, lang: string) {
  return useQuery({
    queryKey: ['sets', game, lang],
    queryFn: () => fetchSets(game!, lang),
    enabled: !!game,
    staleTime: 3_600_000,
  })
}
