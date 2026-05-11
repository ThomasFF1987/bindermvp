import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_CONDITIONS = ['mint', 'near_mint', 'excellent', 'good', 'poor'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type UpdateCardBody = {
  quantity?: unknown
  condition?: unknown
  is_foil?: unknown
  notes?: unknown
  selling_price?: unknown
}

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

function validateUpdate(body: UpdateCardBody) {
  const errors: string[] = []
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

type RouteContext = { params: Promise<{ deckboxId: string; cardId: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { deckboxId, cardId } = await params
    if (!UUID_RE.test(deckboxId) || !UUID_RE.test(cardId)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }

    const body = (await req.json()) as UpdateCardBody
    const errors = validateUpdate(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }

    const patch: Record<string, unknown> = {}
    if (body.quantity !== undefined) patch.quantity = body.quantity
    if (body.condition !== undefined) patch.condition = body.condition
    if (body.is_foil !== undefined) patch.is_foil = body.is_foil
    if (body.notes !== undefined) patch.notes = body.notes
    if (body.selling_price !== undefined) patch.selling_price = body.selling_price

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: 'No fields to update' } },
        { status: 400 },
      )
    }

    const { data, error } = await db()
      .from('deckbox_cards')
      .update(patch)
      .eq('id', cardId)
      .eq('deckbox_id', deckboxId)
      .select()
      .maybeSingle()
    if (error) {
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })
    }
    return NextResponse.json({ data, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { deckboxId, cardId } = await params
    if (!UUID_RE.test(deckboxId) || !UUID_RE.test(cardId)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const { data, error } = await db()
      .from('deckbox_cards')
      .delete()
      .eq('id', cardId)
      .eq('deckbox_id', deckboxId)
      .select('id')
      .maybeSingle()
    if (error) {
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })
    }
    return NextResponse.json({ data: { id: data.id }, error: null })
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
