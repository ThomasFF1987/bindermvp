export function detectLang(query: string): string {
  if (/[éèêàùâîûœç]/i.test(query)) return 'fr'
  if (/[ñ]/i.test(query)) return 'es'
  if (/[üöäß]/i.test(query)) return 'de'
  if (/[ìò]/i.test(query)) return 'it'
  return 'en'
}
