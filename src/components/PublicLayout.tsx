import { type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, NavbarSpacer } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function PublicLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <NavbarSpacer />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}
