import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-yellow-300 to-amber-500 text-zinc-950 shadow-[0_4px_0_0_#b45309] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_0_#b45309]",
  secondary:
    "bg-panel-2 text-white border border-line hover:border-violet-400/60 hover:bg-[#261d45] active:translate-y-[1px]",
  ghost: "text-muted hover:text-white hover:bg-white/5",
  danger: "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    className,
  );
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={clsx("rounded-2xl border border-line bg-panel/80 backdrop-blur-sm", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-line bg-[#0f0b1e] px-4 py-3 text-base text-white placeholder:text-muted/70 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/30",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
      {children}
    </label>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-stroke text-4xl text-white sm:text-5xl">{children}</h1>
      {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-2xl text-white">{children}</h2>
      {action}
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-xl border px-4 py-3 text-sm",
        kind === "error" && "border-rose-500/40 bg-rose-500/10 text-rose-200",
        kind === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        kind === "info" && "border-sky-500/40 bg-sky-500/10 text-sky-200",
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="text-violet-300">{icon}</div>
      <p className="font-display text-xl text-white">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </Card>
  );
}
