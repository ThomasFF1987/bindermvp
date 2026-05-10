import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const { data, error } = await db()
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    if (!data) return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
