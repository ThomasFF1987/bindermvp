import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

type CreateDeckboxBody = {
  name?: unknown
  description?: unknown
  color?: unknown
}

function validateCreate(body: CreateDeckboxBody) {
  const errors: string[] = []
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) {
    errors.push('name must be a non-empty string ≤ 100 chars')
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string or null')
  }
  if (body.color !== undefined && (typeof body.color !== 'string' || !HEX_COLOR_RE.test(body.color))) {
    errors.push('color must be a #RRGGBB hex string')
  }
  return errors
}

export async function GET() {
  try {
    await requireUserId()
    const { data, error } = await db()
      .from('deckboxes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
    return NextResponse.json({ data, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = (await req.json()) as CreateDeckboxBody
    const errors = validateCreate(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }
    const { data, error } = await db()
      .from('deckboxes')
      .insert({
        user_id: userId,
        name: (body.name as string).trim(),
        description: (body.description as string | null | undefined) ?? null,
        color: (body.color as string | undefined) ?? '#6366f1',
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
