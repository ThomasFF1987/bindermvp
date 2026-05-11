import type { CardSearchResult, ExternalCard } from '@/types/card'
import type { CardAdapter, SearchOptions } from './types'

const BASE = 'https://api.kupodb.com'

interface KupoCard {
  id: string
  name: string
  serial: string
  rarity: string
  elements: string[]
  type: string
  image_status: string
  image_uris: { small: string; normal: string; large: string } | null
  set_name: string
  set_code: string
  attributions: { name: string; role: string }[]
}

interface KupoSearchResponse {
  data: KupoCard[]
  total_cards: number
}

function toExternalCard(c: KupoCard): ExternalCard {
  return {
    id: c.id,
    game: 'finalfantasy',
    name: c.name,
    setName: c.set_name,
    setCode: c.set_code,
    number: c.serial,
    imageUrl: c.image_uris?.normal ?? '',
    imageUrlHiRes: c.image_uris?.large,
    rarity: c.rarity,
    types: c.elements,
    artist: c.attributions?.find((a) => a.role === 'artist')?.name,
  }
}

export const finalFantasyAdapter: CardAdapter = {
  game: 'finalfantasy',

  async search(query: string, options?: SearchOptions): Promise<CardSearchResult> {
    if (options?.lang && options.lang !== 'en') {
      return { items: [], page: options.page ?? 1, pageSize: options.pageSize ?? 20, totalCount: 0 }
    }
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const params = new URLSearchParams({ q: query, page: String(page), page_size: String(pageSize) })
    const res = await fetch(`${BASE}/tcg/cards/search?${params}`)
    if (!res.ok) throw new Error(`KupoDB search failed: ${res.status}`)
    const json: KupoSearchResponse = await res.json()
    return {
      items: json.data.map(toExternalCard),
      page,
      pageSize,
      totalCount: json.total_cards,
    }
  },

  async getById(id: string): Promise<ExternalCard> {
    const res = await fetch(`${BASE}/tcg/cards/${id}`)
    if (!res.ok) throw new Error(`KupoDB getById failed: ${res.status}`)
    const card: KupoCard = await res.json()
    return toExternalCard(card)
  },
}
