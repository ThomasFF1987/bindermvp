import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

type UpdateDeckboxBody = {
  name?: unknown
  description?: unknown
  color?: unknown
}

function validateUpdate(body: UpdateDeckboxBody) {
  const errors: string[] = []
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) {
      errors.push('name must be a non-empty string ≤ 100 chars')
    }
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string or null')
  }
  if (body.color !== undefined && (typeof body.color !== 'string' || !HEX_COLOR_RE.test(body.color))) {
    errors.push('color must be a #RRGGBB hex string')
  }
  return errors
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const { data, error } = await db().from('deckboxes').select('*').eq('id', id).maybeSingle()
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

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const body = (await req.json()) as UpdateDeckboxBody
    const errors = validateUpdate(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) patch.name = (body.name as string).trim()
    if (body.description !== undefined) patch.description = body.description
    if (body.color !== undefined) patch.color = body.color

    const { data, error } = await db()
      .from('deckboxes')
      .update(patch)
      .eq('id', id)
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
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const { data, error } = await db().from('deckboxes').delete().eq('id', id).select('id').maybeSingle()
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
