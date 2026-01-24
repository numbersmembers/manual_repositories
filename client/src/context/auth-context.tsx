import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, USER_LEVELS } from '@/lib/types';
import { MOCK_USERS } from '@/lib/mock-data';
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
    // Check local storage for persisted session
    const storedUser = localStorage.getItem('bloter_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('bloter_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(u => u.email === email);
    
    if (foundUser) {
      if (foundUser.status === 'banned') {
        toast({
          variant: "destructive",
          title: "접근 거부됨",
          description: "계정이 영구 정지되었습니다. 관리자에게 문의하세요."
        });
        setIsLoading(false);
        return;
      }
      
      setUser(foundUser);
      localStorage.setItem('bloter_user', JSON.stringify(foundUser));
      toast({
        title: "로그인 성공",
        description: `${foundUser.name}님 환영합니다.`
      });
    } else {
      // Create new user for demo purposes if not found (default to Level 1)
      const newUser: User = {
        id: `u${Date.now()}`,
        email,
        name: email.split('@')[0],
        level: USER_LEVELS.GENERAL,
        status: 'active',
        isAdmin: false,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };
      // In a real app, we'd wait for admin approval. Here we just log them in as Level 1
      setUser(newUser);
      localStorage.setItem('bloter_user', JSON.stringify(newUser));
      toast({
        title: "신규 계정 로그인",
        description: "게스트(Level 1) 권한으로 로그인되었습니다."
      });
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bloter_user');
    // Clear any sensitive data from memory/cache conceptually
    toast({
      title: "로그아웃",
      description: "안전하게 로그아웃되었습니다."
    });
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
