import Link from 'next/link';

export function Navbar() {
  return (
    <header className="border-b border-black/10 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold">
          JasonWorldOfTech
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/products">Products</Link>
          <Link href="/support/chat">Chat</Link>
          <Link href="/support/complaints/new">Complain</Link>
          <Link href="/sign-in" className="rounded-md bg-[#b8e35a] px-3 py-1 text-black">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
