import { AppSidebar, MobileSidebar } from "./sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b bg-background/50 backdrop-blur-sm px-6 flex items-center justify-between md:justify-end shrink-0 z-10">
          <MobileSidebar />
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span>Numbers Data System v1.0</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 relative">
          <div className="mx-auto max-w-6xl animate-in fade-in zoom-in-95 duration-300">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
