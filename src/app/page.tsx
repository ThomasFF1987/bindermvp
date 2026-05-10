import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import LandingPage from './_components/LandingPage'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/binders')

  return <LandingPage />
}
