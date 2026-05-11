'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

export const THEMES = [
  { id: 'blanc', label: 'Blanc',  symbol: '☀',  accent: '#EDD85D' },
  { id: 'bleu',  label: 'Bleu',   symbol: '💧', accent: '#4A9FD4' },
  { id: 'noir',  label: 'Noir',   symbol: '💀', accent: '#A899CC' },
  { id: 'rouge', label: 'Rouge',  symbol: '🔥', accent: '#E04444' },
  { id: 'vert',  label: 'Vert',   symbol: '🌲', accent: '#3AA864' },
] as const

export type Theme = typeof THEMES[number]['id']

type ThemeContextValue = {
  theme: Theme
  accent: string
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'bleu',
  accent: '#4A9FD4',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('bleu')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && THEMES.some(t => t.id === stored)) {
      setThemeState(stored)
      document.documentElement.setAttribute('data-theme', stored)
    }
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  const accent = THEMES.find(t => t.id === theme)!.accent

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
