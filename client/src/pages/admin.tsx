import { useAuth } from "@/context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Trash2, LogIn, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { User, Document, Category, LoginLog } from "@/lib/types";
import { CategoryManager } from "@/components/admin/category-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userApi, documentApi, categoryApi, loginLogApi } from "@/lib/api";

export default function AdminPage() {
  const { user, checkAccess } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkAccess(3)) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [usersData, docsData, catsData, logsData] = await Promise.all([
        userApi.getAll(),
        documentApi.getAll(),
        categoryApi.getAll(),
        loginLogApi.getAll(200)
      ]);
      setUsers(usersData);
      setDocuments(docsData);
      setCategories(catsData);
      setLoginLogs(logsData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "데이터 로드 실패",
        description: error.message || "데이터를 불러오는데 실패했습니다."
      });
    } finally {
      setLoading(false);
    }
  };

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
      await loadData();
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
    if (!confirm("정말로 이 사용자를 강퇴하시겠습니까?")) {
      return;
    }

    try {
      await userApi.updateStatus(userId, 'banned');
      await loadData();
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

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!confirm(`"${docTitle}" 문서를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await documentApi.delete(docId);
      await loadData();
      toast({
        title: "문서 삭제 완료",
        description: "문서가 삭제되었습니다."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "문서 삭제 실패",
        description: error.message || "문서 삭제에 실패했습니다."
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
          <TabsTrigger value="documents">문서 관리</TabsTrigger>
          <TabsTrigger value="categories">카테고리 관리</TabsTrigger>
          <TabsTrigger value="logs">로그인 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="card-3d">
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
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleBanUser(u.id)}
                          disabled={u.status === 'banned' || u.id === user?.id}
                        >
                          강퇴
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="card-3d">
            <CardHeader>
              <CardTitle>문서 관리</CardTitle>
              <CardDescription>
                업로드된 문서를 관리하고 삭제할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>문서명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>보안등급</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        등록된 문서가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {categories.find(c => c.id === doc.categoryId)?.path || '-'}
                        </TableCell>
                        <TableCell>
                          {doc.securityLevel === 'secret' && <Badge variant="destructive">대외비</Badge>}
                          {doc.securityLevel === 'important' && <Badge className="bg-amber-500">중요</Badge>}
                          {doc.securityLevel === 'general' && <Badge variant="outline">일반</Badge>}
                        </TableCell>
                        <TableCell>{doc.authorName}</TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="card-3d">
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

        <TabsContent value="logs">
          <Card className="card-3d">
            <CardHeader>
              <CardTitle>로그인/로그아웃 기록</CardTitle>
              <CardDescription>
                모든 사용자의 인증 활동 기록을 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>활동</TableHead>
                    <TableHead>IP 주소</TableHead>
                    <TableHead>일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        로그인 기록이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.userEmail}</TableCell>
                        <TableCell>
                          {log.action === 'login' ? (
                            <Badge className="bg-green-600">
                              <LogIn className="w-3 h-3 mr-1" />
                              로그인
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <LogOut className="w-3 h-3 mr-1" />
                              로그아웃
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
