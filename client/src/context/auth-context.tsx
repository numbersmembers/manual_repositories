import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: () => void;
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
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        setUser(null);
        return;
      }
      
      const text = await response.text();
      if (!text) {
        setUser(null);
        return;
      }
      
      const userData = JSON.parse(text);
      if (userData) {
        
        if (userData.status === 'banned') {
          toast({
            variant: "destructive",
            title: "접근 거부됨",
            description: "계정이 영구 정지되었습니다. 관리자에게 문의하세요."
          });
          window.location.href = '/api/logout';
          return;
        }
        
        if (userData.status === 'pending') {
          toast({
            variant: "destructive",
            title: "승인 대기 중",
            description: "관리자의 승인을 기다리고 있습니다. 잠시 후 다시 시도해주세요."
          });
          window.location.href = '/api/logout';
          return;
        }
        
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          level: userData.level,
          status: userData.status,
          isAdmin: userData.level === 3,
          avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
        });
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    window.location.href = '/api/logout';
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
