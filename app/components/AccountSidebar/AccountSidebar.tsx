import Link from "next/link";

export type AccountPage = "dashboard" | "profile" | "settings";

const NAV: { id: AccountPage; label: string; href: string }[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export default function AccountSidebar({ active }: { active: AccountPage }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-brand-line bg-brand-surface md:block dark:bg-brand-surface-alt">
      <div className="border-b border-brand-line p-6">
        <h2 className="text-2xl font-bold tracking-tight text-brand-ink ">
          My Account
        </h2>
      </div>
      <nav className="mt-2">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`block px-6 py-3 transition-colors ${
              item.id === active
                ? "border-l-2 border-brand-ink bg-brand-surface-alt font-semibold text-brand-ink  dark:bg-brand-charcoal "
                : "text-brand-muted hover:bg-brand-surface-alt hover:text-brand-ink dark:hover:bg-brand-charcoal dark:hover:text-brand-ink-inverse"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          className="block px-6 py-3 text-brand-muted transition-colors hover:bg-brand-surface-alt hover:text-brand-ink dark:hover:bg-brand-charcoal dark:hover:text-brand-ink-inverse"
        >
          ← Back to store
        </Link>
      </nav>
    </aside>
  );
}
