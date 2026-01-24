import { useAuth } from "@/context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Ban, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { CategoryManager } from "@/components/admin/category-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userApi } from "@/lib/api";

export default function AdminPage() {
  const { user, checkAccess } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkAccess(3)) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "사용자 로드 실패",
        description: error.message || "사용자 목록을 불러오는데 실패했습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  // Security Check
  if (!checkAccess(3)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
        <p className="text-muted-foreground">이 페이지는 관리자(Level 3)만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const handleLevelChange = async (userId: string, newLevel: 1 | 2 | 3) => {
    try {
      await userApi.updateLevel(userId, newLevel);
      await loadUsers();
      toast({
        title: "권한 변경 완료",
        description: "사용자의 레벨이 업데이트되었습니다."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "권한 변경 실패",
        description: error.message || "권한 변경에 실패했습니다."
      });
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 강퇴하시겠습니까? 모든 접근 기록이 삭제됩니다.")) {
      return;
    }

    try {
      await userApi.updateStatus(userId, 'banned');
      await loadUsers();
      toast({
        variant: "destructive",
        title: "사용자 강퇴 처리",
        description: "해당 사용자는 더 이상 로그인할 수 없습니다."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "강퇴 처리 실패",
        description: error.message || "사용자 강퇴에 실패했습니다."
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">관리자 페이지</h2>
          <p className="text-muted-foreground">시스템 설정 및 사용자 관리</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">사용자 관리</TabsTrigger>
          <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>
                사용자 레벨 조정 및 접근 차단 관리
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>현재 레벨</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatarUrl} />
                          <AvatarFallback>{u.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.name}</span>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((lvl) => (
                            <Button
                              key={lvl}
                              variant={u.level === lvl ? "default" : "outline"}
                              size="sm"
                              className={`h-6 w-6 p-0 text-xs ${
                                u.level === lvl 
                                  ? lvl === 3 ? "bg-red-600 hover:bg-red-700" 
                                  : lvl === 2 ? "bg-blue-600 hover:bg-blue-700" 
                                  : "bg-slate-600 hover:bg-slate-700"
                                  : ""
                              }`}
                              onClick={() => handleLevelChange(u.id, lvl as any)}
                              disabled={u.status === 'banned' || u.id === user?.id}
                            >
                              {lvl}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">정상</Badge>
                        ) : (
                          <Badge variant="destructive">차단됨</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleBanUser(u.id)}
                          disabled={u.status === 'banned' || u.id === user?.id}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>카테고리 구조 관리</CardTitle>
              <CardDescription>
                문서 분류 체계를 수정합니다. 하위 카테고리는 상위 카테고리를 먼저 선택 후 생성하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
