import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export function getDb(): SupabaseClient {
  return createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: async () => {
      const { getToken } = await auth()
      return (await getToken()) ?? null
    },
  })
}

export const db = getDb
