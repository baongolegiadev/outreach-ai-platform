export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      {children}
    </main>
  );
}
