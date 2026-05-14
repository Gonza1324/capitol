import { Sidebar } from "@/components/sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[18rem_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
