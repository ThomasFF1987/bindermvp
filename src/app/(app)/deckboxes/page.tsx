import { redirect } from 'next/navigation'

export default function DeckboxesPage() {
  redirect('/collection?tab=deckboxes')
}
