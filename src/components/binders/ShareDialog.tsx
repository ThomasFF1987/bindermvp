'use client'

import { useState } from 'react'
import { useGenerateShareLink, useRevokeShareLink } from '@/hooks/useBinders'

type Props = {
  binderId: string
  shareToken: string | null
  onClose: () => void
}

export function ShareDialog({ binderId, shareToken, onClose }: Props) {
  const generate = useGenerateShareLink(binderId)
  const revoke = useRevokeShareLink(binderId)
  const [copied, setCopied] = useState(false)

  const url =
    shareToken && typeof window !== 'undefined'
      ? `${window.location.origin}/share/${shareToken}`
      : null

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard refusé */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Partager le classeur</h2>
            <p className="text-xs text-gray-500">Lecture seule, sans compte requis.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        {url ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="share-url" className="mb-1 block text-sm font-medium">
                Lien public
              </label>
              <div className="flex gap-2">
                <input
                  id="share-url"
                  type="text"
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={copy}
                  className="rounded bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                className="text-sm text-gray-700 hover:underline disabled:opacity-50"
              >
                {generate.isPending ? 'Régénération…' : 'Régénérer le lien'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Révoquer le lien ? Toute personne possédant ce lien perdra l’accès.'))
                    revoke.mutate()
                }}
                disabled={revoke.isPending}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {revoke.isPending ? 'Révocation…' : 'Révoquer le lien'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Aucun lien actif. Générez-en un pour permettre à n’importe qui de visualiser ce
              classeur en lecture seule.
            </p>
            <button
              type="button"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {generate.isPending ? 'Génération…' : 'Générer un lien public'}
            </button>
          </div>
        )}

        {(generate.error || revoke.error) && (
          <p className="mt-3 text-sm text-red-600">
            Erreur : {((generate.error ?? revoke.error) as Error).message}
          </p>
        )}
      </div>
    </div>
  )
}
