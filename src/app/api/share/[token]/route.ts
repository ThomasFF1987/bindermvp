import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { getAdminDb } from '@/lib/supabase/admin'

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/

type RouteContext = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = await params
    if (!TOKEN_RE.test(token)) {
      return NextResponse.json({ data: null, error: { message: 'Invalid token' } }, { status: 404 })
    }
    const admin = getAdminDb()
    const { data: binder, error: binderErr } = await admin
      .from('binders')
      .select('id, user_id, name, description, color, page_format, page_count, cover_image, created_at, updated_at')
      .eq('share_token', token)
      .maybeSingle()
    if (binderErr) return NextResponse.json({ data: null, error: binderErr }, { status: 500 })
    if (!binder) return NextResponse.json({ data: null, error: { message: 'Not found' } }, { status: 404 })

    const { data: cards, error: cardsErr } = await admin
      .from('binder_cards')
      .select('id, binder_id, card_id, game, page_number, slot, quantity, condition, is_foil, notes, selling_price, added_at')
      .eq('binder_id', binder.id)
      .order('page_number', { ascending: true })
      .order('slot', { ascending: true })
    if (cardsErr) return NextResponse.json({ data: null, error: cardsErr }, { status: 500 })

    let owner: { name: string } | null = null
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(binder.user_id)
      owner = { name: user.username?.trim() || user.firstName?.trim() || 'Anonyme' }
    } catch {
      owner = { name: 'Anonyme' }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...binderPublic } = binder
    return NextResponse.json(
      { data: { binder: binderPublic, cards: cards ?? [], owner }, error: null },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
