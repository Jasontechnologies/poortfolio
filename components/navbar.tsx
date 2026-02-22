import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';
import { LogoutButton } from '@/components/navigation/logout-button';

export async function Navbar() {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    : { data: null };
  const metadataRole =
    typeof user?.app_metadata?.role === 'string'
      ? user.app_metadata.role
      : typeof user?.user_metadata?.role === 'string'
        ? user.user_metadata.role
        : null;
  const resolvedRole = (profile?.role ?? metadataRole ?? 'user').toLowerCase();
  const role = resolvedRole === 'support' ? 'support_agent' : resolvedRole;
  const canSeeAdmin = role === 'support_agent' || role === 'admin' || role === 'super_admin';

  return (
    <header className="sticky top-0 z-30 px-4 pt-3">
      <nav className="mx-auto max-w-6xl rounded-2xl border border-[#d8e2f5] bg-white/78 px-4 py-3 shadow-[0_14px_30px_rgba(22,35,70,0.08)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#121a31] lg:text-base">
            <span className="h-2.5 w-2.5 rounded-full bg-[#9dcf37]" />
            <span>jasonworldoftech</span>
          </Link>

          <div className="hidden items-center gap-4 text-sm text-[#303b5f] lg:flex">
            <Link href="/" prefetch className="hover:text-[#151f3a]">
              Home
            </Link>
            {flags.products_enabled ? (
              <Link href="/products" prefetch className="hover:text-[#151f3a]">
                Products
              </Link>
            ) : null}
            {flags.blog_enabled ? (
              <Link href="/blog" prefetch className="hover:text-[#151f3a]">
                Blog
              </Link>
            ) : null}
            <Link href="/updates" prefetch className="hover:text-[#151f3a]">
              Updates
            </Link>
            <Link href="/security" prefetch className="hover:text-[#151f3a]">
              Security
            </Link>
            <Link href="/status" prefetch className="hover:text-[#151f3a]">
              Status
            </Link>
            <Link href="/contact" prefetch className="hover:text-[#151f3a]">
              Contact
            </Link>
            <Link href="/complaints" prefetch className="hover:text-[#151f3a]">
              Complaints
            </Link>
            {isAuthenticated ? (
              <Link href="/support/chat" prefetch className="hover:text-[#151f3a]">
                Support Chat
              </Link>
            ) : null}
            {isAuthenticated && canSeeAdmin ? (
              <Link href="/admin" prefetch className="hover:text-[#151f3a]">
                Admin
              </Link>
            ) : null}
            {isAuthenticated ? (
              <LogoutButton className="btn-accent !px-4 !py-2" />
            ) : (
              <Link href="/sign-in" prefetch className="btn-accent !px-4 !py-2">
                Account
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <details className="group relative">
              <summary className="list-none rounded-full border border-[#c8d6ef] bg-white/90 px-4 py-2 text-sm font-semibold text-[#1b2748]">
                Menu
              </summary>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#d6def0] bg-white p-3 shadow-[0_16px_34px_rgba(20,31,60,0.16)]">
                <div className="flex flex-col gap-2 text-sm text-[#314066]">
                  <Link href="/" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Home
                  </Link>
                  {flags.products_enabled ? (
                    <Link href="/products" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                      Products
                    </Link>
                  ) : null}
                  {flags.blog_enabled ? (
                    <Link href="/blog" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                      Blog
                    </Link>
                  ) : null}
                  <Link href="/updates" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Updates
                  </Link>
                  <Link href="/security" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Security
                  </Link>
                  <Link href="/status" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Status
                  </Link>
                  <Link href="/contact" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Contact
                  </Link>
                  <Link href="/complaints" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                    Complaints
                  </Link>
                  {isAuthenticated ? (
                    <Link href="/support/chat" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                      Support Chat
                    </Link>
                  ) : null}
                  {isAuthenticated && canSeeAdmin ? (
                    <Link href="/admin" prefetch className="rounded-xl px-3 py-2 hover:bg-[#f3f7ff]">
                      Admin
                    </Link>
                  ) : null}
                  <div className="mt-1 border-t border-[#e0e7f5] pt-3">
                    {isAuthenticated ? (
                      <LogoutButton className="btn-accent !w-full !px-4 !py-2" />
                    ) : (
                      <Link href="/sign-in" prefetch className="btn-accent !w-full !px-4 !py-2">
                        Account
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </nav>
    </header>
  );
}
