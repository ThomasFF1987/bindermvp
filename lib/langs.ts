export type SearchLang = {
  code: string
  label: string
  flag: string
}

export const SEARCH_LANGS: SearchLang[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
]

export const SEARCH_LANG_CODES = SEARCH_LANGS.map((l) => l.code)

const BY_CODE = new Map(SEARCH_LANGS.map((l) => [l.code, l]))

export function getLang(code: string | undefined): SearchLang | undefined {
  return code ? BY_CODE.get(code) : undefined
}
