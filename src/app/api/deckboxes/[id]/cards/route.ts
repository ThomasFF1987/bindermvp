import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const SUPPORTED_GAMES = ['pokemon', 'magic', 'dragonball', 'swu', 'finalfantasy'] as const
const VALID_CONDITIONS = ['mint', 'near_mint', 'excellent', 'good', 'poor'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type AddCardBody = {
  card_id?: unknown
  game?: unknown
  quantity?: unknown
  condition?: unknown
  is_foil?: unknown
  notes?: unknown
  selling_price?: unknown
}

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

function validateAdd(body: AddCardBody) {
  const errors: string[] = []
  if (typeof body.card_id !== 'string' || !body.card_id.trim()) {
    errors.push('card_id must be a non-empty string')
  }
  if (typeof body.game !== 'string' || !SUPPORTED_GAMES.includes(body.game as never)) {
    errors.push(`game must be one of ${SUPPORTED_GAMES.join(', ')}`)
  }
  if (body.quantity !== undefined && (!isInt(body.quantity) || (body.quantity as number) < 1)) {
    errors.push('quantity must be a positive integer')
  }
  if (
    body.condition !== undefined &&
    body.condition !== null &&
    (typeof body.condition !== 'string' || !VALID_CONDITIONS.includes(body.condition as never))
  ) {
    errors.push(`condition must be one of ${VALID_CONDITIONS.join(', ')} or null`)
  }
  if (body.is_foil !== undefined && typeof body.is_foil !== 'boolean') {
    errors.push('is_foil must be a boolean')
  }
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    errors.push('notes must be a string or null')
  }
  if (
    body.selling_price !== undefined &&
    body.selling_price !== null &&
    (typeof body.selling_price !== 'number' || body.selling_price < 0 || !Number.isFinite(body.selling_price))
  ) {
    errors.push('selling_price must be a non-negative number or null')
  }
  return errors
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid deckbox id' } }, { status: 400 })
    }
    const { data, error } = await db()
      .from('deckbox_cards')
      .select('*')
      .eq('deckbox_id', id)
      .order('added_at', { ascending: true })
    if (error) {
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
    return NextResponse.json({ data, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await requireUserId()
    const { id: deckboxId } = await params
    if (!UUID_RE.test(deckboxId)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid deckbox id' } }, { status: 400 })
    }

    const supabase = db()

    const { data: deckbox, error: deckboxError } = await supabase
      .from('deckboxes')
      .select('id')
      .eq('id', deckboxId)
      .maybeSingle()
    if (deckboxError) {
      return NextResponse.json({ data: null, error: deckboxError }, { status: 500 })
    }
    if (!deckbox) {
      return NextResponse.json({ data: null, error: { message: 'Deckbox not found' } }, { status: 404 })
    }

    const body = (await req.json()) as AddCardBody
    const errors = validateAdd(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('deckbox_cards')
      .insert({
        deckbox_id: deckboxId,
        user_id: userId,
        card_id: (body.card_id as string).trim(),
        game: body.game as string,
        quantity: (body.quantity as number | undefined) ?? 1,
        condition: (body.condition as string | null | undefined) ?? null,
        is_foil: (body.is_foil as boolean | undefined) ?? false,
        notes: (body.notes as string | null | undefined) ?? null,
        selling_price: (body.selling_price as number | null | undefined) ?? null,
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
    return NextResponse.json({ data, error: null }, { status: 201 })
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
