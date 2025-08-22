
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/strategic-panel');
      } else {
        router.replace('/login');
      }
    }
  }, [router, isAuthenticated, isLoading]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <LoadingSpinner className="h-12 w-12" />
      <p className="text-muted-foreground">Carregando Ted 1.0...</p>
    </div>
  );
}
