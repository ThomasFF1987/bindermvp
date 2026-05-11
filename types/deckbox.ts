import type { CardCondition, GameType } from './card'

export type Deckbox = {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export type CreateDeckboxInput = {
  name: string
  description?: string | null
  color?: string
}

export type UpdateDeckboxInput = {
  name?: string
  description?: string | null
  color?: string
}

export type DeckboxCard = {
  id: string
  deckbox_id: string
  user_id: string
  card_id: string
  game: GameType
  quantity: number
  condition: CardCondition | null
  is_foil: boolean
  notes: string | null
  selling_price: number | null
  added_at: string
}

export type AddDeckboxCardInput = {
  card_id: string
  game: GameType
  quantity?: number
  condition?: CardCondition | null
  is_foil?: boolean
  notes?: string | null
  selling_price?: number | null
}

export type UpdateDeckboxCardInput = {
  quantity?: number
  condition?: CardCondition | null
  is_foil?: boolean
  notes?: string | null
  selling_price?: number | null
}
