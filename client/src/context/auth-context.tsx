import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, USER_LEVELS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  checkAccess: (requiredLevel: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          level: userData.level,
          status: userData.status,
          isAdmin: userData.isAdmin === 1,
          avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
        });
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "로그인 실패",
          description: errorData.message || "로그인에 실패했습니다."
        });
        setIsLoading(false);
        return;
      }

      const userData = await response.json();
      
      if (userData.status === 'banned') {
        toast({
          variant: "destructive",
          title: "접근 거부됨",
          description: "계정이 영구 정지되었습니다. 관리자에게 문의하세요."
        });
        setIsLoading(false);
        return;
      }

      const mappedUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        level: userData.level,
        status: userData.status,
        isAdmin: userData.isAdmin === 1,
        avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
      };

      setUser(mappedUser);
      toast({
        title: "로그인 성공",
        description: `${mappedUser.name}님 환영합니다.`
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: "서버와 연결할 수 없습니다."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      toast({
        title: "로그아웃",
        description: "안전하게 로그아웃되었습니다."
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user state anyway
      setUser(null);
    }
  };

  const checkAccess = (requiredLevel: number) => {
    if (!user) return false;
    return user.level >= requiredLevel;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
