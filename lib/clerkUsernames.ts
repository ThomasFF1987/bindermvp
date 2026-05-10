import { clerkClient } from '@clerk/nextjs/server'

function displayName(user: {
  username: string | null
  firstName: string | null
}): string {
  return user.username?.trim() || user.firstName?.trim() || 'Anonyme'
}

export async function getUsernamesByIds(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = Array.from(new Set(userIds.filter(Boolean)))
  if (unique.length === 0) return map
  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ userId: unique, limit: unique.length })
    for (const user of data) {
      map.set(user.id, displayName({ username: user.username, firstName: user.firstName }))
    }
  } catch {
    /* fall through, missing IDs default to Anonyme */
  }
  for (const id of unique) {
    if (!map.has(id)) map.set(id, 'Anonyme')
  }
  return map
}

export async function findUserIdByUsername(username: string): Promise<string | null> {
  const trimmed = username.trim()
  if (!trimmed) return null
  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserList({ username: [trimmed], limit: 1 })
    return data[0]?.id ?? null
  } catch {
    return null
  }
}
