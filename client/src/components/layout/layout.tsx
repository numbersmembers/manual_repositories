import { AppSidebar, MobileSidebar } from "./sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ModeToggle } from "@/components/mode-toggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 md:h-16 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 transition-colors">
          <div className="flex items-center gap-2 md:hidden">
             <MobileSidebar />
             <span className="font-bold text-lg tracking-tight">Bloter/Numbers</span>
          </div>
          
          <div className="hidden md:flex flex-1" /> {/* Spacer */}

          <div className="flex items-center gap-2 md:gap-4">
             <div className="hidden md:block text-xs text-muted-foreground border px-2 py-1 rounded bg-muted/50">
                v1.0.0 Stable
             </div>
             <div className="h-4 w-[1px] bg-border mx-1 hidden md:block" />
             <ModeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 relative scroll-smooth">
          <div className="mx-auto max-w-6xl animate-in fade-in zoom-in-95 duration-300 pb-20 md:pb-0">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
