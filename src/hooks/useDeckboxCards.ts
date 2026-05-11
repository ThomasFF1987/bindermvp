'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddDeckboxCardInput, DeckboxCard, UpdateDeckboxCardInput } from '@/types/deckbox'

type ApiResponse<T> = { data: T | null; error: { message?: string; details?: string[] } | null }

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `Request failed (${res.status})`
    const details = json.error?.details?.length ? `: ${json.error.details.join(', ')}` : ''
    throw new Error(msg + details)
  }
  return json.data as T
}

export const deckboxCardsKey = (deckboxId: string) => ['deckboxes', deckboxId, 'cards'] as const

export function useDeckboxCards(deckboxId: string) {
  return useQuery({
    queryKey: deckboxCardsKey(deckboxId),
    queryFn: () => request<DeckboxCard[]>(`/api/deckboxes/${deckboxId}/cards`),
    enabled: Boolean(deckboxId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddDeckboxCard(deckboxId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddDeckboxCardInput) =>
      request<DeckboxCard>(`/api/deckboxes/${deckboxId}/cards`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckboxCardsKey(deckboxId) }),
  })
}

export function useUpdateDeckboxCard(deckboxId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: string; input: UpdateDeckboxCardInput }) =>
      request<DeckboxCard>(`/api/deckbox-cards/${deckboxId}/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckboxCardsKey(deckboxId) }),
  })
}

export function useDeleteDeckboxCard(deckboxId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) =>
      request<{ id: string }>(`/api/deckbox-cards/${deckboxId}/${cardId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckboxCardsKey(deckboxId) }),
  })
}
