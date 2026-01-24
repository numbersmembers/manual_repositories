import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await login(email);
  };

  const handleQuickLogin = (role: 'admin' | 'staff' | 'general') => {
    const emails = {
      admin: 'mrmoon@numbers.co.kr',
      staff: 'staff@numbers.co.kr',
      general: 'user@numbers.co.kr'
    };
    setEmail(emails[role]);
    login(emails[role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-black/5 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Bloter/Numbers</CardTitle>
          <CardDescription>업무 매뉴얼 및 문서 관리 시스템</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full h-11 relative font-medium hover:bg-slate-50"
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-5 h-5 absolute left-4" alt="Google" />
              Google 계정으로 로그인
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or demo login</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleQuickLogin('admin')} disabled={isLoading}>
              관리자 (Lvl 3)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleQuickLogin('staff')} disabled={isLoading}>
              스태프 (Lvl 2)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleQuickLogin('general')} disabled={isLoading}>
              일반 (Lvl 1)
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일 직접 입력 (테스트용)</Label>
              <Input 
                id="email" 
                placeholder="name@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              로그인
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground pb-6">
          <p>보안 접속 중입니다. 모든 활동은 기록됩니다.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
