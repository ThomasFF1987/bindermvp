import type { ExternalCard } from '@/types/card'
import type { CardAdapter, SearchOptions } from './types'

const BASE_URL = 'https://api.tcgdex.net/v2/fr'

type SlimCard = {
  id: string
  localId: string
  name: string
  image?: string
}

type FullCard = SlimCard & {
  rarity?: string
  illustrator?: string
  types?: string[]
  set?: { id?: string; name?: string }
}

function imageUrl(base: string | undefined, quality: 'low' | 'high'): string | undefined {
  if (!base) return undefined
  return `${base}/${quality}.png`
}

function deriveSetCode(card: SlimCard): string {
  if (!card.id.includes('-')) return ''
  return card.id.slice(0, card.id.lastIndexOf('-'))
}

function toExternalSlim(card: SlimCard): ExternalCard {
  const setCode = deriveSetCode(card)
  return {
    id: card.id,
    game: 'pokemon',
    name: card.name,
    setName: setCode,
    setCode,
    number: card.localId,
    imageUrl: imageUrl(card.image, 'low') ?? '',
    imageUrlHiRes: imageUrl(card.image, 'high'),
  }
}

function toExternalFull(card: FullCard): ExternalCard {
  const setCode = card.set?.id ?? deriveSetCode(card)
  return {
    id: card.id,
    game: 'pokemon',
    name: card.name,
    setName: card.set?.name ?? setCode,
    setCode,
    number: card.localId,
    imageUrl: imageUrl(card.image, 'low') ?? '',
    imageUrlHiRes: imageUrl(card.image, 'high'),
    rarity: card.rarity,
    types: card.types,
    artist: card.illustrator,
  }
}

export const pokemonAdapter: CardAdapter = {
  game: 'pokemon',

  async search(query, options: SearchOptions = {}) {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const params = new URLSearchParams()
    const trimmed = query.trim()
    if (trimmed) params.set('name', trimmed)
    params.set('pagination:page', String(page))
    params.set('pagination:itemsPerPage', String(pageSize))

    const res = await fetch(`${BASE_URL}/cards?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`TCGdex API error: ${res.status} ${res.statusText}`)
    }
    const items = (await res.json()) as SlimCard[]
    const headerTotal =
      res.headers.get('pagination-count') ??
      res.headers.get('pagination-totalcount') ??
      res.headers.get('count')
    const totalCount = headerTotal
      ? parseInt(headerTotal, 10)
      : items.length < pageSize
        ? (page - 1) * pageSize + items.length
        : page * pageSize + 1

    return {
      items: items.map(toExternalSlim),
      page,
      pageSize,
      totalCount,
    }
  },

  async getById(id) {
    const res = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`TCGdex API error: ${res.status} ${res.statusText}`)
    }
    const card = (await res.json()) as FullCard
    return toExternalFull(card)
  },
}
