import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type MoveBody = { cardId?: unknown; toPage?: unknown; toSlot?: unknown }

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v)
}

type RouteContext = { params: Promise<{ binderId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { binderId } = await params
    if (!UUID_RE.test(binderId)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }

    const body = (await req.json()) as MoveBody
    if (typeof body.cardId !== 'string' || !UUID_RE.test(body.cardId)) {
      return NextResponse.json({ data: null, error: { message: 'cardId required' } }, { status: 400 })
    }
    if (!isInt(body.toPage) || body.toPage < 1) {
      return NextResponse.json({ data: null, error: { message: 'toPage must be >= 1' } }, { status: 400 })
    }
    if (!isInt(body.toSlot) || body.toSlot < 1) {
      return NextResponse.json({ data: null, error: { message: 'toSlot must be >= 1' } }, { status: 400 })
    }

    const supabase = db()

    const { data: binder, error: binderError } = await supabase
      .from('binders')
      .select('id, page_format, page_count')
      .eq('id', binderId)
      .maybeSingle()
    if (binderError) {
      return NextResponse.json({ data: null, error: binderError }, { status: 500 })
    }
    if (!binder) {
      return NextResponse.json({ data: null, error: { message: 'Binder not found' } }, { status: 404 })
    }
    if (body.toSlot > binder.page_format) {
      return NextResponse.json(
        { data: null, error: { message: `toSlot must be between 1 and ${binder.page_format}` } },
        { status: 400 },
      )
    }

    const { data, error } = await supabase.rpc('move_binder_card', {
      p_card_id: body.cardId,
      p_to_page: body.toPage,
      p_to_slot: body.toSlot,
    })
    if (error) {
      const status = error.message === 'card_not_found' ? 404 : 500
      return NextResponse.json({ data: null, error }, { status })
    }

    const row = Array.isArray(data) ? data[0] : data
    return NextResponse.json({
      data: { moved: row?.moved_id ?? body.cardId, swappedWith: row?.swapped_id ?? null },
      error: null,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
