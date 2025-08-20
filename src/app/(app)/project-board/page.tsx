
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This is a temporary redirect component.
// In the future, this page will host the Kanban board.
export default function ProjectBoardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/strategic-initiatives');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecionando para as Iniciativas Estratégicas...</p>
    </div>
  );
}
