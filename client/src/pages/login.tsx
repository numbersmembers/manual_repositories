import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

import _______ from "@assets/넘버스 파비콘.png";

export default function LoginPage() {
  const { login, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  if (user) {
    setLocation("/");
    return null;
  }

  const handleGoogleLogin = () => {
    login('mrmoon@numbers.co.kr');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px]" />
      </div>
      
      <Card className="card-3d w-full max-w-md border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-8 pt-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Bloter/Numbers
          </CardTitle>
          <CardDescription className="text-base">업무 매뉴얼 및 문서 관리 시스템</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button 
            variant="outline" 
            className="btn-3d w-full h-12 relative font-medium text-base"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img src={_______} className="w-5 h-5 absolute left-4" alt="Google" />
                Google 계정으로 로그인
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-xs text-muted-foreground pb-8">
          <p>보안 접속 중입니다. 모든 활동은 기록됩니다.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
