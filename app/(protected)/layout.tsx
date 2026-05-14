import { Sidebar } from "@/components/sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[15rem_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <div className="w-full px-4 py-5 md:px-5 lg:px-6">{children}</div>
      </main>
    </div>
  );
}
