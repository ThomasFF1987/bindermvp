'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Message, MessageFolder, SendMessageInput } from '@/types/message'

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

const messagesKey = (folder: MessageFolder) => ['messages', folder] as const
const messageKey = (id: string) => ['messages', 'detail', id] as const
const unreadKey = ['messages', 'unread-count'] as const

export function useMessages(folder: MessageFolder) {
  return useQuery({
    queryKey: messagesKey(folder),
    queryFn: () => request<Message[]>(`/api/messages?folder=${folder}`),
    staleTime: 30 * 1000,
  })
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: id ? messageKey(id) : ['messages', 'detail', '__none__'],
    queryFn: () => request<Message>(`/api/messages/${id}`),
    enabled: Boolean(id),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: unreadKey,
    queryFn: () => request<{ count: number }>('/api/messages/unread-count'),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['messages'] })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      request<Message>('/api/messages', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useToggleImportant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_important }: { id: string; is_important: boolean }) =>
      request<Message>(`/api/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_important }),
      }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useTrashMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<Message>(`/api/messages/${id}/trash`, { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useRestoreMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<Message>(`/api/messages/${id}/restore`, { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      request<{ id: string }>(`/api/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useEmptyTrash() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      request<{ deleted: number }>('/api/messages/trash/empty', { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  })
}
