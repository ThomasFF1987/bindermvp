'use client'

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type Lang = 'fr' | 'en'

const SearchLangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null)

export function SearchLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  return (
    <SearchLangContext.Provider value={{ lang, setLang }}>
      {children}
    </SearchLangContext.Provider>
  )
}

export function useSearchLang() {
  const ctx = useContext(SearchLangContext)
  if (!ctx) throw new Error('useSearchLang must be used within SearchLangProvider')
  return ctx
}
