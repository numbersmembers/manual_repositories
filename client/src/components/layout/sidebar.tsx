import { useAuth } from "@/context/auth-context";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Shield,
  Upload,
  LogOut,
  ChevronRight,
  Menu,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.level === 3;

  const menuItems = [
    { title: "대시보드", icon: LayoutDashboard, href: "/" },
    { title: "문서함", icon: FolderOpen, href: "/documents" },
    { title: "파일 업로드", icon: Upload, href: "/upload" },
  ];

  if (isAdmin) {
    menuItems.push({ title: "관리자 페이지", icon: Shield, href: "/admin" });
  }

  return (
    <div className="flex h-screen bg-card border-r w-64 flex-col hidden md:flex transition-colors">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0">
            B
          </div>
          <div className="flex flex-col leading-none">
            <span>Bloter/Numbers</span>
            <span className="text-muted-foreground font-light text-sm">Manual</span>
            <span className="text-muted-foreground font-light text-xs opacity-70">Repositories</span>
          </div>
        </h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground mb-4 px-2 uppercase tracking-wider">
          Menu
        </div>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={location === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 mb-1",
                location === item.href && "font-semibold text-primary bg-primary/10 hover:bg-primary/15"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </Button>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
          <span>Level {user?.level}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700">
            {user?.level === 3 ? "Admin" : user?.level === 2 ? "Staff" : "General"}
          </span>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
          onClick={logout}
        >
          <LogOut className="w-3 h-3 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.level === 3;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden -ml-2">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[80%] max-w-sm">
        <div className="h-full flex flex-col bg-background">
          <div className="p-6 border-b flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black shrink-0">
                  B
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-bold tracking-tight">Bloter/Numbers</span>
                  <span className="text-sm text-muted-foreground">Mobile</span>
                </div>
             </div>
             {/* Mode Toggle in Mobile Menu */}
             <div className="scale-90 origin-right">
               {/* Use a simpler toggle for mobile or just the standard one */}
             </div>
          </div>
          
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
              Navigation
            </div>
            
            <Link href="/" onClick={() => setOpen(false)}>
              <Button variant={location === "/" ? "secondary" : "ghost"} className="w-full justify-start mb-2 h-12">
                <LayoutDashboard className="w-5 h-5 mr-3" /> 대시보드
              </Button>
            </Link>
            <Link href="/documents" onClick={() => setOpen(false)}>
              <Button variant={location === "/documents" ? "secondary" : "ghost"} className="w-full justify-start mb-2 h-12">
                <FolderOpen className="w-5 h-5 mr-3" /> 문서함
              </Button>
            </Link>
            <Link href="/upload" onClick={() => setOpen(false)}>
              <Button variant={location === "/upload" ? "secondary" : "ghost"} className="w-full justify-start mb-2 h-12">
                <Upload className="w-5 h-5 mr-3" /> 파일 업로드
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)}>
                <Button variant={location === "/admin" ? "secondary" : "ghost"} className="w-full justify-start mb-2 h-12 text-blue-600 dark:text-blue-400">
                  <Shield className="w-5 h-5 mr-3" /> 관리자 페이지
                </Button>
              </Link>
            )}
          </div>

          <div className="p-4 border-t bg-muted/20">
            <div className="flex items-center gap-3 mb-4 p-2 bg-card rounded-lg border shadow-sm">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                   <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                     Level {user?.level}
                   </span>
                </div>
              </div>
            </div>
            <Button variant="destructive" className="w-full" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> 로그아웃
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
