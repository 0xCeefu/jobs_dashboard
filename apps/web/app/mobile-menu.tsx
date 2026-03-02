"use client";

import { useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import {
  BriefcaseIcon,
  UserIcon,
  ShieldCheckIcon,
  LogInIcon,
  UserPlusIcon,
  LogOutIcon,
} from "./icons";
import { logoutAction } from "./user/actions";

interface MobileMenuProps {
  role: string | null | undefined;
}

export function MobileMenu({ role }: MobileMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="mobile-menu">
      <summary className="btn cursor-pointer">Menu</summary>
      <nav
        className="mobile-menu-panel stack"
        aria-label="Mobile primary"
        onClick={close}
      >
        <Link href="/" className="nav-link">
          <BriefcaseIcon size={14} /> Jobs
        </Link>
        {role && (
          <Link href="/user/profile" className="nav-link">
            <UserIcon size={14} /> Profile
          </Link>
        )}
        {role === "admin" && (
          <Link href="/admin/users" className="nav-link">
            <ShieldCheckIcon size={14} /> Admin
          </Link>
        )}
        {!role && (
          <Link href="/user/login" className="nav-link">
            <LogInIcon size={14} /> Login
          </Link>
        )}
        {!role && (
          <Link href="/user/signup" className="nav-link">
            <UserPlusIcon size={14} /> Sign up
          </Link>
        )}
        {role && (
          <form action={logoutAction}>
            <button className="btn danger" type="submit">
              <LogOutIcon size={14} /> Logout
            </button>
          </form>
        )}
        <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
          <ThemeToggle />
        </div>
      </nav>
    </details>
  );
}
