'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export default function Header() {
  const pathname = usePathname();
  const isOnDashboard = pathname === '/dashboard';

  return (
    <header className="flex justify-end items-center p-4 gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="text-gray-200 hover:text-gray-500 transition-colors cursor-pointer">
            Log in / Sign in
          </button>
        </SignInButton>
      </SignedOut>
      
      <SignedIn>
        <nav className="flex items-center gap-3">
          <Link 
            href={isOnDashboard ? "/" : "/dashboard"}
            className="bg-foreground text-background px-4 py-2 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 dark:hover:text-black transition-colors"
          >
            {isOnDashboard ? "Upload Your Files" : "Edit Your Files"}
          </Link>
          <UserButton afterSignOutUrl="/" />
        </nav>
      </SignedIn>
    </header>
  );
} 