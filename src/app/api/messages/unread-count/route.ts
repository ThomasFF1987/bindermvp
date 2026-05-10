import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest) {
  try {
    const me = await requireUserId()
    const { count, error } = await db()
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', me)
      .is('deleted_at', null)
      .is('read_at', null)
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data: { count: count ?? 0 }, error: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
