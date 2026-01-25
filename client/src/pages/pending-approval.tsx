import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

interface PendingApprovalProps {
  userName: string;
  userEmail: string;
  onApproved: () => void;
  onLogout: () => void;
}

export default function PendingApproval({ userName, userEmail, onApproved, onLogout }: PendingApprovalProps) {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkApprovalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.status === 'active') {
          onApproved();
        }
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleManualCheck = () => {
    checkApprovalStatus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold">승인 대기 중</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">{userName}님, 환영합니다!</p>
            <p className="text-muted-foreground text-sm">{userEmail}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-center text-sm">
              관리자의 승인을 기다리고 있습니다.
            </p>
            <p className="text-center text-xs text-muted-foreground">
              승인이 완료되면 자동으로 로그인됩니다.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            {checking ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            <span>
              마지막 확인: {lastChecked.toLocaleTimeString('ko-KR')}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={handleManualCheck}
              disabled={checking}
              className="w-full"
              data-testid="button-check-status"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              승인 상태 확인
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onLogout}
              className="w-full text-muted-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
