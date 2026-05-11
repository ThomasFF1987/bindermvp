import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_THEMES = ['blanc', 'bleu', 'noir', 'rouge', 'vert'] as const
const SUPPORTED_GAMES = ['pokemon', 'magic', 'dragonball', 'swu', 'finalfantasy'] as const

type SettingsBody = {
  theme?: unknown
  default_game?: unknown
}

function validate(body: SettingsBody) {
  const errors: string[] = []
  if (body.theme !== undefined && !VALID_THEMES.includes(body.theme as never)) {
    errors.push(`theme must be one of ${VALID_THEMES.join(', ')}`)
  }
  if (body.default_game !== undefined && !SUPPORTED_GAMES.includes(body.default_game as never)) {
    errors.push(`default_game must be one of ${SUPPORTED_GAMES.join(', ')}`)
  }
  return errors
}

export async function GET() {
  try {
    const userId = await requireUserId()
    const { data, error } = await db()
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({
      data: data ?? { user_id: userId, theme: 'system', default_game: 'pokemon' },
      error: null,
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = (await req.json()) as SettingsBody
    const errors = validate(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }

    const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() }
    if (body.theme !== undefined) patch.theme = body.theme
    if (body.default_game !== undefined) patch.default_game = body.default_game

    const { data, error } = await db()
      .from('user_settings')
      .upsert(patch, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : 'Unknown error'
  if (message === 'Unauthorized') {
    return NextResponse.json({ data: null, error: { message } }, { status: 401 })
  }
  return NextResponse.json({ data: null, error: { message } }, { status: 500 })
}
