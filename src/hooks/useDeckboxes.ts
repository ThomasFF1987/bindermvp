'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateDeckboxInput, Deckbox, UpdateDeckboxInput } from '@/types/deckbox'

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

export const deckboxesKey = ['deckboxes'] as const
export const deckboxKey = (id: string) => ['deckboxes', id] as const

export function useDeckboxes() {
  return useQuery({
    queryKey: deckboxesKey,
    queryFn: () => request<Deckbox[]>('/api/deckboxes'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useDeckbox(id: string) {
  return useQuery({
    queryKey: deckboxKey(id),
    queryFn: () => request<Deckbox>(`/api/deckboxes/${id}`),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateDeckbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDeckboxInput) =>
      request<Deckbox>('/api/deckboxes', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckboxesKey }),
  })
}

export function useUpdateDeckbox(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateDeckboxInput) =>
      request<Deckbox>(`/api/deckboxes/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: deckboxesKey })
      qc.setQueryData(deckboxKey(id), data)
    },
  })
}

export function useDeleteDeckbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<{ id: string }>(`/api/deckboxes/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckboxesKey }),
  })
}
