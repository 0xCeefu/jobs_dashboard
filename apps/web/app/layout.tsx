import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { getUserRole } from "../lib/session";
import { logoutAction } from "./user/actions";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import {
  BriefcaseIcon,
  UserIcon,
  ShieldCheckIcon,
  LogInIcon,
  UserPlusIcon,
  LogOutIcon,
} from "./icons";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Jobs Dashboard",
  description: "Job discovery and admin dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await getUserRole();
  const themeInitScript = `(() => {
    try {
      const key = 'theme';
      const stored = localStorage.getItem(key);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    } catch {}
  })();`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="topbar">
          <div className="container topbar-inner">
            <Link href="/" className="topbar-brand">
              <span className="topbar-brand-icon">
                <BriefcaseIcon size={16} />
              </span>
              <span>Jobs Dashboard</span>
            </Link>

            <nav className="nav-links nav-desktop" aria-label="Primary">
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
                <Link href="/user/signup" className="btn primary">
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
              <ThemeToggle />
            </nav>

            <MobileMenu role={role} />
          </div>
        </header>
        <main className="container main-content">{children}</main>
      </body>
    </html>
  );
}
