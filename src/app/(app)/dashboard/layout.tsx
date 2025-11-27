import { UserNav } from '@/components/layout/user-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex h-14 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-lg">
        <div className="ml-auto flex items-center gap-2">
          <UserNav />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
