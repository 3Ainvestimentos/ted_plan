
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// This page now acts as a simple redirector to the main entry point of the app.
// The actual authentication and maintenance checks are handled by middleware and layouts.
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
        if (isAuthenticated) {
            router.replace('/strategic-initiatives');
        } else {
            router.replace('/login');
        }
    }
  }, [isLoading, isAuthenticated, router]);

  // Render a global spinner while the initial auth check is happening.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
