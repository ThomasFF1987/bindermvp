import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { getAdapter, SUPPORTED_GAMES } from '@/lib/adapters'
import { SEARCH_LANG_CODES } from '@/lib/langs'
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
    const setCode = url.searchParams.get('setCode') ?? undefined
    const langsParam = url.searchParams.get('langs') ?? undefined
    const langParam = url.searchParams.get('lang') ?? undefined
    const page = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1
    const pageSize = pageSizeRaw ? Math.min(60, Math.max(1, parseInt(pageSizeRaw, 10) || 20)) : 20

    const adapter = getAdapter(game as GameType)

    const allowed = new Set(SEARCH_LANG_CODES)
    let LANGS: string[]
    if (langsParam) {
      LANGS = langsParam.split(',').map((s) => s.trim()).filter((c) => allowed.has(c))
      if (LANGS.length === 0) LANGS = SEARCH_LANG_CODES
    } else if (langParam) {
      LANGS = allowed.has(langParam) ? [langParam] : SEARCH_LANG_CODES
    } else {
      LANGS = SEARCH_LANG_CODES
    }

    const results = await Promise.all(
      LANGS.map((lang) =>
        adapter.search(q, { page, pageSize, lang, setCode }).catch((err) => {
          console.error(`[search] ${game} lang=${lang} failed:`, err instanceof Error ? err.message : err)
          return null
        }),
      ),
    )

    const merged: ExternalCard[] = []
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (!r) continue
      const lang = LANGS[i]
      const seen = new Set<string>()
      for (const item of r.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        merged.push(item.lang ? item : { ...item, lang })
      }
    }

    const langOrder = new Map(LANGS.map((l, i) => [l, i]))
    merged.sort((a, b) => {
      if (a.setCode !== b.setCode) return a.setCode.localeCompare(b.setCode)
      const numA = parseInt(a.number.replace(/\D/g, '') || '0', 10)
      const numB = parseInt(b.number.replace(/\D/g, '') || '0', 10)
      if (numA !== numB) return numA - numB
      if (a.number !== b.number) return a.number.localeCompare(b.number)
      return (langOrder.get(a.lang ?? '') ?? 99) - (langOrder.get(b.lang ?? '') ?? 99)
    })

    const result = {
      items: merged,
      page,
      pageSize,
      totalCount: results.reduce((sum, r) => sum + (r?.totalCount ?? 0), 0),
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
