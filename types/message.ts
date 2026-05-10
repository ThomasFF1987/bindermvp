export type MessageFolder = 'inbox' | 'important' | 'trash'

export type Message = {
  id: string
  sender_id: string
  recipient_id: string
  subject: string | null
  body: string
  is_important: boolean
  read_at: string | null
  deleted_at: string | null
  created_at: string
  sender_username: string
}

export type SendMessageInput = {
  recipient_username: string
  subject?: string
  body: string
}
