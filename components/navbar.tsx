import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur" style={{ borderColor: '#ececec' }}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          jasonworldoftech
        </Link>
        <div className="flex items-center gap-5 text-sm text-black/80">
          <Link href="/products">Products</Link>
          <Link href="/support/chat">Chat</Link>
          <Link href="/support/complaints/new">Complaints</Link>
          <Link href="/sign-in" className="btn-accent !px-4 !py-2">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
