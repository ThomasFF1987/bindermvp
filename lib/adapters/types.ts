import type { CardSearchResult, ExternalCard, GameType } from '@/types/card'

export type SearchOptions = { page?: number; pageSize?: number; lang?: string; setCode?: string }

export type CardSet = { code: string; name: string; releaseDate?: string }

export interface CardAdapter {
  game: GameType
  search(query: string, options?: SearchOptions): Promise<CardSearchResult>
  getById(id: string): Promise<ExternalCard>
  getSets(lang?: string): Promise<CardSet[]>
}
