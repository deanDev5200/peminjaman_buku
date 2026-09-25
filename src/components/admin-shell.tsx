'use client';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import Sidebar from '@/components/sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

        {/* Main content */}
        <main className="flex-1 min-w-0 lg:ml-0">
          <div className="lg:hidden sticky top-0 z-30 flex items-center border-b bg-card px-4 py-2">
            <button
              className="p-2 rounded-md hover:bg-accent"
              onClick={() => setIsOpen(true)}
              aria-label="Buka menu navigasi"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
