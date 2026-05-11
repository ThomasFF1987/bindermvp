'use client'

import { useEffect, useState } from 'react'
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext'

export default function SettingsPage() {
  const { theme, accent, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json: { data: { theme: string } | null }) => {
        if (json.data?.theme && !localStorage.getItem('theme')) {
          const t = json.data.theme as Theme
          if (THEMES.some(th => th.id === t)) setTheme(t)
        }
      })
      .catch(() => {})
  }, [setTheme])

  async function handleThemeChange(t: Theme) {
    setTheme(t)
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: t }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Préférences
      </h1>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          Thème
        </h2>
        <p className="mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choisissez la couleur d&apos;accent de l&apos;application.
        </p>

        <div className="flex items-center gap-4">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                title={t.label}
                className="relative flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: t.accent,
                  border: active ? `2px solid ${t.accent}` : '2px solid transparent',
                  outline: active ? `2px solid ${t.accent}66` : 'none',
                  outlineOffset: '3px',
                  opacity: active ? 1 : 0.4,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '16px',
                  textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                }}
              >
                {t.symbol}
              </button>
            )
          })}
        </div>

        {/* Nom du thème actif */}
        <p className="mt-4 text-sm font-medium" style={{ color: accent, transition: 'color 0.3s ease' }}>
          {THEMES.find(t => t.id === theme)?.label}
        </p>

        {saving && <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Enregistrement…</p>}
        {saved && <p className="mt-2 text-xs" style={{ color: accent }}>Préférences enregistrées.</p>}
      </div>
    </section>
  )
}
