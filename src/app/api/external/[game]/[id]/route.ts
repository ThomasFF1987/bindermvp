import { NextRequest, NextResponse } from 'next/server'
import { getAdapter, SUPPORTED_GAMES } from '@/lib/adapters'
import type { GameType } from '@/types/card'

type RouteContext = { params: Promise<{ game: string; id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { game, id } = await params
    if (!SUPPORTED_GAMES.includes(game as GameType)) {
      return NextResponse.json(
        { data: null, error: { message: `Unsupported game "${game}"` } },
        { status: 400 },
      )
    }
    const card = await getAdapter(game as GameType).getById(id)
    return NextResponse.json({ data: card, error: null }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
