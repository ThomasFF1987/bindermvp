import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { getUsernamesByIds } from '@/lib/clerkUsernames'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RouteContext = { params: Promise<{ id: string }> }

function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : 'Unknown error'
  if (message === 'Unauthorized') {
    return NextResponse.json({ data: null, error: { message } }, { status: 401 })
  }
  return NextResponse.json({ data: null, error: { message } }, { status: 500 })
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const me = await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const supa = db()
    const { data, error } = await supa.from('messages').select('*').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    if (!data) return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })

    if (data.recipient_id === me && !data.read_at) {
      const { data: updated } = await supa
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle()
      if (updated) Object.assign(data, updated)
    }

    const usernames = await getUsernamesByIds([data.sender_id])
    return NextResponse.json({
      data: { ...data, sender_username: usernames.get(data.sender_id) ?? 'Anonyme' },
      error: null,
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const body = (await req.json()) as { is_important?: unknown }
    const patch: Record<string, unknown> = {}
    if (typeof body.is_important === 'boolean') patch.is_important = body.is_important
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: 'No valid fields' } },
        { status: 400 },
      )
    }
    const { data, error } = await db()
      .from('messages')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    if (!data) return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const me = await requireUserId()
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid id' } }, { status: 400 })
    }
    const supa = db()
    const { data: existing } = await supa
      .from('messages')
      .select('id, recipient_id, deleted_at')
      .eq('id', id)
      .maybeSingle()
    if (!existing || existing.recipient_id !== me) {
      return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })
    }
    if (!existing.deleted_at) {
      return NextResponse.json(
        { data: null, error: { message: 'Le message doit être en corbeille avant suppression définitive' } },
        { status: 409 },
      )
    }
    const { error } = await supa.from('messages').delete().eq('id', id)
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data: { id }, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}
