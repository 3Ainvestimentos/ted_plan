"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AppPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/strategic-initiatives');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <LoadingSpinner className="h-12 w-12" />
    </div>
  );
}
