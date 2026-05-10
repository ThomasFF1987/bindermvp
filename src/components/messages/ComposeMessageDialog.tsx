'use client'

import { useState } from 'react'
import { useSendMessage } from '@/hooks/useMessages'

type Props = {
  onClose: () => void
}

export function ComposeMessageDialog({ onClose }: Props) {
  const send = useSendMessage()
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient.trim() || !body.trim()) return
    send.mutate(
      {
        recipient_username: recipient.trim(),
        subject: subject.trim() || undefined,
        body: body.trim(),
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold">Nouveau message</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient" className="mb-1 block text-sm font-medium">
              Destinataire (pseudo)
            </label>
            <input
              id="recipient"
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              placeholder="ex. johndoe"
            />
          </div>

          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium">
              Sujet (optionnel)
            </label>
            <input
              id="subject"
              type="text"
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="body" className="mb-1 block text-sm font-medium">
              Message
            </label>
            <textarea
              id="body"
              required
              rows={6}
              maxLength={10000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full resize-y rounded border border-gray-300 px-3 py-2"
            />
          </div>

          {send.error && (
            <p className="text-sm text-red-600">Erreur : {(send.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={send.isPending}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {send.isPending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
