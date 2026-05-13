import type { ExternalCard } from '@/types/card'
import type { CardAdapter, CardSet, SearchOptions } from './types'

const baseUrl = (lang = 'en') => `https://api.tcgdex.net/v2/${lang}`

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

function toExternalSlim(card: SlimCard, lang: string): ExternalCard {
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
    lang,
  }
}

function toExternalFull(card: FullCard, lang: string): ExternalCard {
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
    lang,
  }
}

async function fetchPokemonTcgImage(
  name: string,
  number: string,
): Promise<{ small: string; large: string } | null> {
  try {
    const q = encodeURIComponent(`name:"${name}" number:${number}`)
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=1`,
      {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY ?? '' },
        next: { revalidate: 86400 },
      },
    )
    if (!res.ok) return null
    const json = (await res.json()) as { data: { images: { small: string; large: string } }[] }
    return json.data[0]?.images ?? null
  } catch {
    return null
  }
}

export const pokemonAdapter: CardAdapter = {
  game: 'pokemon',

  async getSets(lang = 'en'): Promise<CardSet[]> {
    type TcgdexSet = { id: string; name: string; releaseDate?: string }
    const res = await fetch(`${baseUrl(lang)}/sets`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`TCGdex sets error: ${res.status}`)
    const sets = (await res.json()) as TcgdexSet[]
    return sets.map((s) => ({ code: s.id, name: s.name, releaseDate: s.releaseDate }))
  },

  async search(query, options: SearchOptions = {}) {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const lang = options.lang ?? 'en'
    const setCode = options.setCode

    const trimmed = query.trim()

    let items: SlimCard[]
    let totalCount: number

    // Sans nom + set sélectionné : l'endpoint /cards ne filtre pas par set.id seul.
    // On récupère le set entier (qui contient son tableau "cards") et on pagine en mémoire.
    if (!trimmed && setCode) {
      const setRes = await fetch(`${baseUrl(lang)}/sets/${encodeURIComponent(setCode)}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      })
      if (!setRes.ok) {
        throw new Error(`TCGdex set error: ${setRes.status} ${setRes.statusText}`)
      }
      const setData = (await setRes.json()) as { cards?: SlimCard[] }
      const allCards = setData.cards ?? []
      totalCount = allCards.length
      items = allCards.slice((page - 1) * pageSize, page * pageSize)
    } else {
      const params = new URLSearchParams()
      if (trimmed) params.set('name', trimmed)
      if (setCode) params.set('set.id', setCode)
      params.set('pagination:page', String(page))
      params.set('pagination:itemsPerPage', String(pageSize))
      const res = await fetch(`${baseUrl(lang)}/cards?${params}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) {
        throw new Error(`TCGdex API error: ${res.status} ${res.statusText}`)
      }
      items = (await res.json()) as SlimCard[]
      const headerTotal =
        res.headers.get('pagination-count') ??
        res.headers.get('pagination-totalcount') ??
        res.headers.get('count')
      totalCount = headerTotal
        ? parseInt(headerTotal, 10)
        : items.length < pageSize
          ? (page - 1) * pageSize + items.length
          : page * pageSize + 1
    }

    // Pour l'endpoint EN: TCGdex slim est parfois incomplet. On fetch le full
    // card pour chaque résultat (comme le fait getById, qui marche dans le binder).
    // Pour les autres langues: slim suffit.
    const items_final = lang === 'en'
      ? await Promise.all(
          items.map(async (slim) => {
            try {
              const r = await fetch(
                `${baseUrl('en')}/cards/${encodeURIComponent(slim.id)}`,
                { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } },
              )
              if (r.ok) {
                const full = (await r.json()) as FullCard
                const card = toExternalFull(full, lang)
                if (!card.imageUrl) {
                  const fallback = await fetchPokemonTcgImage(card.name, card.number)
                  if (fallback) {
                    card.imageUrl = fallback.small
                    card.imageUrlHiRes = fallback.large
                  }
                }
                return card
              }
            } catch {}
            return toExternalSlim(slim, lang)
          }),
        )
      : items.map((s) => toExternalSlim(s, lang))

    return {
      items: items_final,
      page,
      pageSize,
      totalCount,
    }
  },

  async getById(id) {
    const res = await fetch(`${baseUrl()}/cards/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      throw new Error(`TCGdex API error: ${res.status} ${res.statusText}`)
    }
    const card = (await res.json()) as FullCard
    const result = toExternalFull(card, 'en')

    if (!card.image) {
      const fallback = await fetchPokemonTcgImage(card.name, card.localId)
      if (fallback) {
        result.imageUrl = fallback.small
        result.imageUrlHiRes = fallback.large
      }
    }

    return result
  },
}
