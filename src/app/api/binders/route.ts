import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_PAGE_FORMATS = [4, 8, 9, 12] as const
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

type CreateBinderBody = {
  name?: unknown
  description?: unknown
  color?: unknown
  page_format?: unknown
  page_count?: unknown
  cover_image?: unknown
}

function validateCreate(body: CreateBinderBody) {
  const errors: string[] = []
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) {
    errors.push('name must be a non-empty string ≤ 100 chars')
  }
  if (typeof body.color !== 'string' || !HEX_COLOR_RE.test(body.color)) {
    errors.push('color must be a #RRGGBB hex string')
  }
  if (
    typeof body.page_format !== 'number' ||
    !VALID_PAGE_FORMATS.includes(body.page_format as (typeof VALID_PAGE_FORMATS)[number])
  ) {
    errors.push('page_format must be 4, 8, 9, or 12')
  }
  if (body.page_count !== undefined) {
    if (
      typeof body.page_count !== 'number' ||
      !Number.isInteger(body.page_count) ||
      body.page_count < 1
    ) {
      errors.push('page_count must be a positive integer')
    }
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string')
  }
  if (body.cover_image !== undefined && body.cover_image !== null && typeof body.cover_image !== 'string') {
    errors.push('cover_image must be a string')
  }
  return errors
}

export async function GET() {
  try {
    await requireUserId()
    const { data, error } = await db()
      .from('binders')
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
    const body = (await req.json()) as CreateBinderBody
    const errors = validateCreate(body)
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }
    const { data, error } = await db()
      .from('binders')
      .insert({
        user_id: userId,
        name: (body.name as string).trim(),
        description: (body.description as string | null | undefined) ?? null,
        color: body.color as string,
        page_format: body.page_format as number,
        page_count: (body.page_count as number | undefined) ?? 1,
        cover_image: (body.cover_image as string | null | undefined) ?? null,
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
