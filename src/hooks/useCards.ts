'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddCardInput, BinderCard, UpdateCardInput } from '@/types/card'

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

export const cardsKey = (binderId: string) => ['binders', binderId, 'cards'] as const

export function useBinderCards(binderId: string) {
  return useQuery({
    queryKey: cardsKey(binderId),
    queryFn: () => request<BinderCard[]>(`/api/binders/${binderId}/cards`),
    enabled: Boolean(binderId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddCard(binderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddCardInput) =>
      request<BinderCard>(`/api/binders/${binderId}/cards`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardsKey(binderId) }),
  })
}

export function useUpdateCard(binderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, input }: { cardId: string; input: UpdateCardInput }) =>
      request<BinderCard>(`/api/cards/${binderId}/${cardId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardsKey(binderId) }),
  })
}

export function useMoveCard(binderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, toPage, toSlot }: { cardId: string; toPage: number; toSlot: number }) =>
      request<{ moved: string; swappedWith: string | null }>(
        `/api/cards/${binderId}/move`,
        { method: 'POST', body: JSON.stringify({ cardId, toPage, toSlot }) },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardsKey(binderId) }),
  })
}

export function useDeleteCard(binderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) =>
      request<{ id: string }>(`/api/cards/${binderId}/${cardId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardsKey(binderId) }),
  })
}
