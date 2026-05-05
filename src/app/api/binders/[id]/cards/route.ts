import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const SUPPORTED_GAMES = ['pokemon', 'magic', 'dragonball', 'swu'] as const
const VALID_CONDITIONS = ['mint', 'near_mint', 'excellent', 'good', 'poor'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type AddCardBody = {
  card_id?: unknown
  game?: unknown
  page_number?: unknown
  slot?: unknown
  quantity?: unknown
  condition?: unknown
  is_foil?: unknown
  notes?: unknown
  selling_price?: unknown
}

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

function validateAdd(body: AddCardBody, pageFormat: number) {
  const errors: string[] = []
  if (typeof body.card_id !== 'string' || !body.card_id.trim()) {
    errors.push('card_id must be a non-empty string')
  }
  if (typeof body.game !== 'string' || !SUPPORTED_GAMES.includes(body.game as never)) {
    errors.push(`game must be one of ${SUPPORTED_GAMES.join(', ')}`)
  }
  if (body.page_number !== undefined && (!isInt(body.page_number) || (body.page_number as number) < 1)) {
    errors.push('page_number must be a positive integer')
  }
  if (!isInt(body.slot) || (body.slot as number) < 1 || (body.slot as number) > pageFormat) {
    errors.push(`slot must be an integer between 1 and ${pageFormat}`)
  }
  if (body.quantity !== undefined && (!isInt(body.quantity) || (body.quantity as number) < 1)) {
    errors.push('quantity must be a positive integer')
  }
  if (
    body.condition !== undefined &&
    body.condition !== null &&
    (typeof body.condition !== 'string' ||
      !VALID_CONDITIONS.includes(body.condition as never))
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
      return NextResponse.json({ data: null, error: { message: 'Invalid binder id' } }, { status: 400 })
    }
    const { data, error } = await db()
      .from('binder_cards')
      .select('*')
      .eq('binder_id', id)
      .order('page_number', { ascending: true })
      .order('slot', { ascending: true })
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
    const { id: binderId } = await params
    if (!UUID_RE.test(binderId)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid binder id' } }, { status: 400 })
    }

    const supabase = db()

    const { data: binder, error: binderError } = await supabase
      .from('binders')
      .select('id, page_format')
      .eq('id', binderId)
      .maybeSingle()
    if (binderError) {
      return NextResponse.json({ data: null, error: binderError }, { status: 500 })
    }
    if (!binder) {
      return NextResponse.json({ data: null, error: { message: 'Binder not found' } }, { status: 404 })
    }

    const body = (await req.json()) as AddCardBody
    const errors = validateAdd(body, binder.page_format)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('binder_cards')
      .insert({
        binder_id: binderId,
        user_id: userId,
        card_id: (body.card_id as string).trim(),
        game: body.game as string,
        page_number: (body.page_number as number | undefined) ?? 1,
        slot: body.slot as number,
        quantity: (body.quantity as number | undefined) ?? 1,
        condition: (body.condition as string | null | undefined) ?? null,
        is_foil: (body.is_foil as boolean | undefined) ?? false,
        notes: (body.notes as string | null | undefined) ?? null,
        selling_price: (body.selling_price as number | null | undefined) ?? null,
      })
      .select()
      .single()
    if (error) {
      const status = error.code === '23505' ? 409 : 500
      return NextResponse.json({ data: null, error }, { status })
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
