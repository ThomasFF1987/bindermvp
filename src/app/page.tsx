import Link from 'next/link'

export default function Home() {
  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/binders', label: 'Binders' },
    { href: '/binders/new', label: 'New binder' },
    { href: '/binders/demo', label: 'Binder view (demo)' },
    { href: '/binders/demo/edit', label: 'Edit binder (demo)' },
    { href: '/search', label: 'Search' },
    { href: '/settings', label: 'Settings' },
    { href: '/sign-in', label: 'Sign in' },
    { href: '/sign-up', label: 'Sign up' },
  ]
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Binder MVP</h1>
      <ul className="list-disc pl-6 space-y-1">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="underline">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
