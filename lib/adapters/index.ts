import type { GameType } from '@/types/card'
import type { CardAdapter } from './types'
import { pokemonAdapter } from './pokemon'
import { finalFantasyAdapter } from './finalfantasy'

const adapters: Partial<Record<GameType, CardAdapter>> = {
  pokemon: pokemonAdapter,
  finalfantasy: finalFantasyAdapter,
}

export function getAdapter(game: GameType): CardAdapter {
  const adapter = adapters[game]
  if (!adapter) {
    throw new Error(`No adapter registered for game "${game}"`)
  }
  return adapter
}

export const SUPPORTED_GAMES: GameType[] = Object.keys(adapters) as GameType[]
