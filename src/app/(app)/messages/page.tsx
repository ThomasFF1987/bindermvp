'use client'

import { useState } from 'react'
import {
  useMessages,
  useMessage,
  useUnreadCount,
  useToggleImportant,
  useTrashMessage,
  useRestoreMessage,
  useDeleteMessage,
  useEmptyTrash,
} from '@/hooks/useMessages'
import { ComposeMessageDialog } from '@/components/messages/ComposeMessageDialog'
import type { Message, MessageFolder } from '@/types/message'

const FOLDER_LABELS: Record<MessageFolder, string> = {
  inbox: 'Reçus',
  important: 'Importants',
  trash: 'Corbeille',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesPage() {
  const [folder, setFolder] = useState<MessageFolder>('inbox')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)

  const { data: messages, isLoading } = useMessages(folder)
  const { data: unread } = useUnreadCount()
  const emptyTrash = useEmptyTrash()

  function selectFolder(f: MessageFolder) {
    setFolder(f)
    setSelectedId(null)
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-6xl gap-4 p-4">
      <aside className="flex w-56 shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Nouveau message
        </button>

        <nav className="mt-2 flex flex-col">
          {(Object.keys(FOLDER_LABELS) as MessageFolder[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => selectFolder(f)}
              className={`flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === f ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              <span>{FOLDER_LABELS[f]}</span>
              {f === 'inbox' && unread && unread.count > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {unread.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {folder === 'trash' && messages && messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Vider la corbeille ? Cette action est définitive.'))
                emptyTrash.mutate()
            }}
            disabled={emptyTrash.isPending}
            className="mt-4 rounded border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {emptyTrash.isPending ? 'Suppression…' : 'Vider la corbeille'}
          </button>
        )}

        {folder === 'trash' && (
          <p className="mt-2 text-xs text-gray-500">
            Les messages restant en corbeille plus de 90 jours sont supprimés automatiquement.
          </p>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 gap-4">
        <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded border border-gray-200">
          <header className="border-b border-gray-200 px-4 py-2 text-sm font-medium">
            {FOLDER_LABELS[folder]}
          </header>
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <p className="p-4 text-sm text-gray-500">Chargement…</p>
            ) : !messages || messages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">Aucun message.</p>
            ) : (
              <ul>
                {messages.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                        selectedId === m.id ? 'bg-gray-100' : ''
                      } ${!m.read_at && folder !== 'trash' ? 'font-semibold' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm">{m.sender_username}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatDate(m.created_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm text-gray-700">
                        {m.is_important && <span className="mr-1 text-yellow-500">★</span>}
                        {m.subject ?? '(sans sujet)'}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-gray-500">{m.body}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded border border-gray-200">
          {selectedId ? (
            <MessageDetail
              id={selectedId}
              folder={folder}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <p className="p-8 text-center text-sm text-gray-500">
              Sélectionnez un message à afficher.
            </p>
          )}
        </div>
      </div>

      {composeOpen && <ComposeMessageDialog onClose={() => setComposeOpen(false)} />}
    </section>
  )
}

function MessageDetail({
  id,
  folder,
  onClose,
}: {
  id: string
  folder: MessageFolder
  onClose: () => void
}) {
  const { data: m, isLoading } = useMessage(id)
  const toggleImportant = useToggleImportant()
  const trash = useTrashMessage()
  const restore = useRestoreMessage()
  const del = useDeleteMessage()

  if (isLoading) return <p className="p-6 text-sm text-gray-500">Chargement…</p>
  if (!m) return <p className="p-6 text-sm text-gray-500">Message introuvable.</p>

  const inTrash = Boolean(m.deleted_at)

  return (
    <article className="flex h-full flex-col">
      <header className="border-b border-gray-200 p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">
              {m.subject ?? '(sans sujet)'}
            </h2>
            <p className="text-xs text-gray-500">
              De <span className="font-medium">{m.sender_username}</span> ·{' '}
              {formatDate(m.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {!inTrash && (
            <button
              type="button"
              onClick={() =>
                toggleImportant.mutate({ id: m.id, is_important: !m.is_important })
              }
              className="rounded border border-gray-300 px-2 py-1 hover:border-gray-400"
            >
              {m.is_important ? '★ Retirer important' : '☆ Marquer important'}
            </button>
          )}
          {!inTrash ? (
            <button
              type="button"
              onClick={() => trash.mutate(m.id, { onSuccess: onClose })}
              className="rounded border border-gray-300 px-2 py-1 hover:border-gray-400"
            >
              Supprimer
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => restore.mutate(m.id, { onSuccess: onClose })}
                className="rounded border border-gray-300 px-2 py-1 hover:border-gray-400"
              >
                Restaurer
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Supprimer définitivement ce message ?'))
                    del.mutate(m.id, { onSuccess: onClose })
                }}
                className="rounded border border-red-300 px-2 py-1 text-red-600 hover:bg-red-50"
              >
                Supprimer définitivement
              </button>
            </>
          )}
          {folder === 'trash' && (
            <span className="ml-auto self-center text-gray-400">
              En corbeille depuis {m.deleted_at ? formatDate(m.deleted_at) : '—'}
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-auto whitespace-pre-wrap p-4 text-sm text-gray-800">
        {m.body}
      </div>
    </article>
  )
}
