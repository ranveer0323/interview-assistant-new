"use client";

import Image from "next/image";
import Link from "next/link";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import NavItems from "./NavItems";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 w-full flex justify-center z-50">
      <div className="w-full max-w-7xl flex items-center justify-between shadow-md rounded-lg mt-6 px-6 py-4">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <Image
              src="/images/logo.svg"
              alt="logo"
              width={46}
              height={44}
              priority
            />
          </div>
        </Link>

        {/* Nav Links + Auth */}
        <div className="flex items-center gap-8">
          <NavItems/>
        </div>

        <div className="flex items-center gap-8">
          
          
          <SignedOut>
            <SignInButton>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
