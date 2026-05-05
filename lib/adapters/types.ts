import type { CardSearchResult, ExternalCard, GameType } from '@/types/card'

export type SearchOptions = { page?: number; pageSize?: number }

export interface CardAdapter {
  game: GameType
  search(query: string, options?: SearchOptions): Promise<CardSearchResult>
  getById(id: string): Promise<ExternalCard>
}
