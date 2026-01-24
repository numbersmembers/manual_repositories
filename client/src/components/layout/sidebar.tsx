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
import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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
    <div className="flex h-screen bg-background border-r w-64 flex-col hidden md:flex">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black">
            B
          </div>
          Bloter<span className="text-muted-foreground font-light">/Manual</span>
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
          <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
  const isAdmin = user?.level === 3;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold tracking-tight">Bloter/Numbers</h1>
          </div>
          {/* Reuse Logic - Ideally extract this to a shared component */}
          <div className="flex-1 py-6 px-4">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start mb-2">
                <LayoutDashboard className="w-4 h-4 mr-2" /> 대시보드
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="ghost" className="w-full justify-start mb-2">
                <FolderOpen className="w-4 h-4 mr-2" /> 문서함
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="ghost" className="w-full justify-start mb-2">
                <Upload className="w-4 h-4 mr-2" /> 파일 업로드
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start mb-2 text-primary">
                  <Shield className="w-4 h-4 mr-2" /> 관리자 페이지
                </Button>
              </Link>
            )}
            <Button variant="ghost" className="w-full justify-start mt-auto text-destructive" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> 로그아웃
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
