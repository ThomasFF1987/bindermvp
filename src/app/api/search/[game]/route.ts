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
        {
          data: null,
          error: { message: `Unsupported game "${game}"`, supported: SUPPORTED_GAMES },
        },
        { status: 400 },
      )
    }
    const url = new URL(req.url)
    const q = url.searchParams.get('q') ?? ''
    const pageRaw = url.searchParams.get('page')
    const pageSizeRaw = url.searchParams.get('pageSize')
    const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1
    const pageSize = pageSizeRaw ? Math.min(60, Math.max(1, parseInt(pageSizeRaw, 10) || 20)) : 20

    const adapter = getAdapter(game as GameType)
    const result = await adapter.search(q, { page, pageSize })
    return NextResponse.json({ data: result, error: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
