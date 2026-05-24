"use client";

import clsx from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";

type Variant = "solid" | "ghost" | "violet";

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
  solid:
    "bg-white text-slate-900 hover:bg-white/90 shadow-[0_8px_30px_-8px_rgba(255,255,255,0.4)]",
  ghost:
    "border border-white/20 text-white hover:border-white/40 hover:bg-white/5",
  violet:
    "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-[0_8px_30px_-8px_rgba(139,92,246,0.6)] hover:from-violet-500 hover:to-violet-400",
};

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = CommonProps & { href: string };
type ButtonProps = CommonProps &
  Omit<HTMLMotionProps<"button">, "children" | "className">;

export function GlowButton(props: LinkProps | ButtonProps) {
  const { variant = "solid", className, children } = props;
  const cls = clsx(baseClasses, variantClasses[variant], className);

  if ("href" in props) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, className: _c, children: _ch, ...rest } = props;
  return (
    <motion.button whileTap={{ scale: 0.97 }} {...rest} className={cls}>
      {children}
    </motion.button>
  );
}
