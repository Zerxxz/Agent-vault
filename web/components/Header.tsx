"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { WalletConnect } from "./WalletConnect";

export function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-4 z-50 mx-auto mb-12 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/30 px-5 py-3 backdrop-blur-xl"
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-semibold tracking-tight"
      >
        <span className="text-xl">🕯️</span>
        <span>Heirloom</span>
      </Link>

      <nav className="hidden items-center gap-1 text-sm md:flex">
        <NavLink
          href="/agents"
          active={pathname === "/agents" || pathname.startsWith("/agent/")}
        >
          My agents
        </NavLink>
        <NavLink href="/create" active={pathname === "/create"}>
          Create
        </NavLink>
        <NavLink href="/settings" active={pathname === "/settings"}>
          Settings
        </NavLink>
      </nav>

      <WalletConnect />
    </motion.header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-full px-3 py-1.5 transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
