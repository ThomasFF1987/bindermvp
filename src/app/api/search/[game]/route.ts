import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { getAdapter, SUPPORTED_GAMES } from '@/lib/adapters'
import type { ExternalCard, GameType } from '@/types/card'

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
    const LANGS = ['en', 'fr', 'de', 'es', 'it', 'pt', 'ja', 'ko', 'zh-TW', 'zh-CN']
    const results = await Promise.all(
      LANGS.map((lang) =>
        adapter.search(q, { page, pageSize, lang }).catch((err) => {
          console.error(`[search] ${game} lang=${lang} failed:`, err instanceof Error ? err.message : err)
          return null
        }),
      ),
    )

    const best = new Map<string, ExternalCard>()
    for (const item of results.flatMap((r) => r?.items ?? [])) {
      const existing = best.get(item.id)
      if (!existing || (!existing.imageUrl && item.imageUrl)) {
        best.set(item.id, item)
      }
    }
    const merged = Array.from(best.values())

    const result = {
      items: merged,
      page,
      pageSize,
      totalCount: Math.max(...results.map((r) => r?.totalCount ?? 0)),
    }
    return NextResponse.json({ data: result, error: null }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
