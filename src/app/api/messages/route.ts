import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { findUserIdByUsername, getUsernamesByIds } from '@/lib/clerkUsernames'
import type { MessageFolder } from '@/types/message'

const FOLDERS: MessageFolder[] = ['inbox', 'important', 'trash']

function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : 'Unknown error'
  if (message === 'Unauthorized') {
    return NextResponse.json({ data: null, error: { message } }, { status: 401 })
  }
  return NextResponse.json({ data: null, error: { message } }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const me = await requireUserId()
    const folderParam = req.nextUrl.searchParams.get('folder') ?? 'inbox'
    if (!FOLDERS.includes(folderParam as MessageFolder)) {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid folder' } },
        { status: 400 },
      )
    }
    const folder = folderParam as MessageFolder
    const supa = db()

    if (folder === 'trash') {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      await supa
        .from('messages')
        .delete()
        .eq('recipient_id', me)
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoff)
    }

    let query = supa
      .from('messages')
      .select('*')
      .eq('recipient_id', me)
      .order('created_at', { ascending: false })
      .limit(100)

    if (folder === 'inbox') query = query.is('deleted_at', null)
    else if (folder === 'important') query = query.is('deleted_at', null).eq('is_important', true)
    else query = query.not('deleted_at', 'is', null)

    const { data, error } = await query
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })

    const senderIds = (data ?? []).map((m) => m.sender_id)
    const usernames = await getUsernamesByIds(senderIds)
    const enriched = (data ?? []).map((m) => ({
      ...m,
      sender_username: usernames.get(m.sender_id) ?? 'Anonyme',
    }))
    return NextResponse.json({ data: enriched, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUserId()
    const body = (await req.json()) as {
      recipient_username?: unknown
      subject?: unknown
      body?: unknown
    }
    const errors: string[] = []
    if (typeof body.recipient_username !== 'string' || !body.recipient_username.trim()) {
      errors.push('recipient_username is required')
    }
    if (typeof body.body !== 'string' || !body.body.trim()) {
      errors.push('body is required')
    }
    if (typeof body.body === 'string' && body.body.length > 10000) {
      errors.push('body must be ≤ 10000 chars')
    }
    if (
      body.subject !== undefined &&
      body.subject !== null &&
      (typeof body.subject !== 'string' || (body.subject as string).length > 200)
    ) {
      errors.push('subject must be a string ≤ 200 chars')
    }
    if (errors.length) {
      return NextResponse.json(
        { data: null, error: { message: 'Validation failed', details: errors } },
        { status: 400 },
      )
    }

    const recipientUsername = (body.recipient_username as string).trim()
    const recipientId = await findUserIdByUsername(recipientUsername)
    if (!recipientId) {
      return NextResponse.json(
        { data: null, error: { message: `Utilisateur "${recipientUsername}" introuvable` } },
        { status: 404 },
      )
    }
    if (recipientId === me) {
      return NextResponse.json(
        { data: null, error: { message: 'Impossible de s’envoyer un message à soi-même' } },
        { status: 400 },
      )
    }

    const subject =
      typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : null
    const text = (body.body as string).trim()

    const { data, error } = await db()
      .from('messages')
      .insert({
        sender_id: me,
        recipient_id: recipientId,
        subject,
        body: text,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })

    return NextResponse.json({ data: { ...data, sender_username: '' }, error: null })
  } catch (e) {
    return errorResponse(e)
  }
}
