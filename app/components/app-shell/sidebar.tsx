const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Measurement Plan", href: "/plan" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-white p-4 md:block">
      <div className="text-lg font-semibold">Event Inspector</div>

      <nav className="mt-6 space-y-1">
        {nav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
