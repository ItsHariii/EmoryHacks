export function Footer() {
  const links = [
    { href: '#how-it-works', label: 'How it works' },
    { href: '#problem', label: 'Why Ovi' },
    { href: '#features', label: 'Features' },
  ]

  return (
    <footer className="py-16 px-6 border-t border-ovi-border/60 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        {/* Left: branding */}
        <div className="text-center sm:text-left">
          <a href="#" className="inline-block">
            <img src="/logo.png" alt="Ovi" className="h-10 w-auto" loading="lazy" />
          </a>
          <p className="mt-2 text-sm text-ovi-text-muted max-w-xs">
            Empowering expecting mothers with nutrition that grows with them.
          </p>
        </div>

        {/* Right: nav links */}
        <nav className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ovi-text-secondary hover:text-ovi-text-primary transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <p className="mt-8 text-center text-sm text-ovi-text-muted">
        © {new Date().getFullYear()} Ovi. All rights reserved.
      </p>
    </footer>
  )
}
