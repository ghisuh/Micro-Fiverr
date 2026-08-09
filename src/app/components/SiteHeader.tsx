"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/gigs", label: "Explore" },
  { href: "/orders", label: "Orders" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Micro home">
          <span className="brand-mark" aria-hidden="true">m</span>
          <span>micro</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-actions">
          {status === "authenticated" ? (
            <>
              <span className="user-name">{session.user?.name || session.user?.email}</span>
              <button className="button button-quiet button-small" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-login">Log in</Link>
              <Link href="/signup" className="button button-dark button-small">Join micro</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
