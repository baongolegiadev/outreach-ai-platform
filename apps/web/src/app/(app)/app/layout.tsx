import { LogoutButton } from '@/components/auth/logout-button';
import { RequireAuth } from '@/components/auth/require-auth';

const sections = ['Dashboard', 'Leads', 'Sequences', 'Pipeline', 'Analytics'];

export default function AppShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-100">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Outreach AI Platform</p>
              <h1 className="text-xl font-semibold text-slate-900">Authenticated Workspace</h1>
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <p
                  key={section}
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-600"
                >
                  {section}
                </p>
              ))}
            </nav>
          </aside>
          <section>{children}</section>
        </div>
      </div>
    </RequireAuth>
  );
}
