"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Create Interview", href: "/create-interview" },
  { label: "Dashboard", href: "/dashboard" },
];

const NavItems = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {navItems.map(({ label, href }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            "text-gray-700 hover:text-blue-600 transition font-medium",
            pathname === href && "text-blue-600 font-bold"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
