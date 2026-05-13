import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { getAdapter, SUPPORTED_GAMES } from '@/lib/adapters'
import type { GameType } from '@/types/card'

type RouteContext = { params: Promise<{ game: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { game } = await params
    if (!SUPPORTED_GAMES.includes(game as GameType)) {
      return NextResponse.json(
        { data: null, error: { message: `Unsupported game "${game}"` } },
        { status: 400 },
      )
    }
    const lang = new URL(req.url).searchParams.get('lang') ?? undefined
    const sets = await getAdapter(game as GameType).getSets(lang)
    sets.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''))
    return NextResponse.json({ data: sets, error: null }, {
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
