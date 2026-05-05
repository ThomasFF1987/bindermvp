'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Binder, CreateBinderInput, UpdateBinderInput } from '@/types/binder'

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

export const bindersKey = ['binders'] as const
export const binderKey = (id: string) => ['binders', id] as const

export function useBinders() {
  return useQuery({
    queryKey: bindersKey,
    queryFn: () => request<Binder[]>('/api/binders'),
  })
}

export function useBinder(id: string) {
  return useQuery({
    queryKey: binderKey(id),
    queryFn: () => request<Binder>(`/api/binders/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateBinder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBinderInput) =>
      request<Binder>('/api/binders', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bindersKey }),
  })
}

export function useUpdateBinder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBinderInput) =>
      request<Binder>(`/api/binders/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: bindersKey })
      qc.setQueryData(binderKey(id), data)
    },
  })
}

export function useDeleteBinder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => request<{ id: string }>(`/api/binders/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bindersKey }),
  })
}
