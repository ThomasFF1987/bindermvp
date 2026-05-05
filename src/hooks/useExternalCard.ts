'use client'

import { useQuery } from '@tanstack/react-query'
import type { ExternalCard, GameType } from '@/types/card'

type ApiResponse<T> = { data: T | null; error: { message?: string } | null }

async function fetchExternalCard(game: GameType, id: string): Promise<ExternalCard> {
  const res = await fetch(`/api/external/${game}/${encodeURIComponent(id)}`)
  const json = (await res.json()) as ApiResponse<ExternalCard>
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`)
  }
  return json.data
}

export function useExternalCard(game: GameType, id: string) {
  return useQuery({
    queryKey: ['external', game, id],
    queryFn: () => fetchExternalCard(game, id),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: Boolean(game && id),
  })
}
