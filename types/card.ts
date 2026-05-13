export type GameType = 'pokemon' | 'magic' | 'dragonball' | 'swu' | 'finalfantasy'

export type CardCondition = 'mint' | 'near_mint' | 'excellent' | 'good' | 'poor'

export type BinderCard = {
  id: string
  binder_id: string
  user_id: string
  card_id: string
  game: GameType
  page_number: number
  slot: number
  quantity: number
  condition: CardCondition | null
  is_foil: boolean
  notes: string | null
  selling_price: number | null
  added_at: string
}

export type AddCardInput = {
  card_id: string
  game: GameType
  slot: number
  page_number?: number
  quantity?: number
  condition?: CardCondition | null
  is_foil?: boolean
  notes?: string | null
  selling_price?: number | null
}

export type UpdateCardInput = Partial<Omit<AddCardInput, 'card_id' | 'game'>>

export type ExternalCard = {
  id: string
  game: GameType
  name: string
  setName: string
  setCode: string
  number: string
  imageUrl: string
  imageUrlHiRes?: string
  rarity?: string
  types?: string[]
  artist?: string
  lang?: string
}

export type CardSearchResult = {
  items: ExternalCard[]
  page: number
  pageSize: number
  totalCount: number
}
