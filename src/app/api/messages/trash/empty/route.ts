import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const me = await requireUserId()
    const { data, error } = await db()
      .from('messages')
      .delete()
      .eq('recipient_id', me)
      .not('deleted_at', 'is', null)
      .select('id')
    if (error) return NextResponse.json({ data: null, error }, { status: 500 })
    return NextResponse.json({ data: { deleted: data?.length ?? 0 }, error: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    if (message === 'Unauthorized') {
      return NextResponse.json({ data: null, error: { message } }, { status: 401 })
    }
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
