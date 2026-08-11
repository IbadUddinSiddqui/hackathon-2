import Link from "next/link";

export type AccountPage = "dashboard" | "profile" | "settings";

const NAV: { id: AccountPage; label: string; href: string }[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export default function AccountSidebar({ active }: { active: AccountPage }) {
  return (
    <aside className="hidden w-64 shrink-0 bg-white shadow-md md:block">
      <div className="border-b p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Account</h2>
      </div>
      <nav className="mt-2">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`block px-6 py-3 transition-colors ${
              item.id === active
                ? "border-l-4 border-black bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          className="block px-6 py-3 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
        >
          ← Back to store
        </Link>
      </nav>
    </aside>
  );
}
