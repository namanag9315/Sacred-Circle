"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ExternalLink, Headphones, House, LogOut, Settings2, UsersRound, Video } from "lucide-react";
import { navItems } from "@/lib/adminConfig";
import { AdminAuthProvider, useAdminAuth } from "./AdminAuth";

function ShellInner({ children }: { children: ReactNode }) {
  const auth = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.loading && !auth.isAdmin && pathname !== "/login") {
      router.replace("/login");
    }
  }, [auth.loading, auth.isAdmin, pathname, router]);

  if (auth.loading) {
    return <div className="login-shell"><div className="card login-card">Preparing admin sanctuary...</div></div>;
  }

  if (!auth.isAdmin && pathname !== "/login") {
    return null;
  }

  if (pathname === "/login") return <>{children}</>;

  const iconByHref = {
    "/dashboard": House,
    "/meditations": Headphones,
    "/videos": Video,
    "/users": UsersRound,
    "/settings": Settings2
  } as const;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/sacred-flame-logo.png" alt="Sacred Circle" className="brand-logo" />
          <div>
            <h1>Sacred Circle</h1>
            <p>Content Manager</p>
          </div>
        </div>
        <nav className="nav">
          {navItems.map(([label, href]) => {
            const Icon = iconByHref[href];
            return (
              <Link key={href} href={href} className={pathname === href ? "active" : ""}>
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <a className="sidebar-preview" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            Preview the app
          </a>
          <div className="sidebar-user">
            <span>{auth.email?.slice(0, 1).toUpperCase() || "A"}</span>
            <div><strong>Administrator</strong><small>{auth.email}</small></div>
            <button aria-label="Log out" title="Log out" onClick={async () => { await auth.signOut(); router.push("/login"); }}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <ShellInner>{children}</ShellInner>
    </AdminAuthProvider>
  );
}
