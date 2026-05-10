export type PageFormat = 4 | 8 | 9 | 12

export type Binder = {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  page_format: PageFormat
  page_count: number
  cover_image: string | null
  share_token: string | null
  created_at: string
  updated_at: string
}

export type CreateBinderInput = {
  name: string
  color: string
  page_format: PageFormat
  description?: string | null
  cover_image?: string | null
  page_count?: number
}

export type UpdateBinderInput = Partial<CreateBinderInput> & { page_count?: number }
