import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, FileIcon, Lock, ShieldAlert, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, Category } from "@/lib/types";
import { Link, useLocation } from "wouter";
import { documentApi, categoryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docs, cats] = await Promise.all([
        documentApi.getAll(),
        categoryApi.getAll()
      ]);
      setDocuments(docs);
      setCategories(cats);
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

  const recentDocs = documents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const handleOpenDoc = (doc: Document) => {
    setLocation(`/documents/${doc.id}`);
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">안녕하세요, {user?.name}님</h2>
        <p className="text-muted-foreground mt-1">
          현재 <Badge variant="outline" className="ml-1 font-mono">{user?.level === 3 ? "Admin (Lvl 3)" : user?.level === 2 ? "Staff (Lvl 2)" : "General (Lvl 1)"}</Badge> 권한으로 접속 중입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-3d bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">총 접근 가능 문서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{documents.length}</div>
            <p className="text-xs text-blue-100 mt-1">전체 문서 중 접근 가능한 파일</p>
          </CardContent>
        </Card>
        
        <Card className="card-3d">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">최근 업로드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">이번 달 신규 문서</p>
          </CardContent>
        </Card>

        <Card className="card-3d">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">내 문서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {documents.filter(d => d.authorId === user?.id).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">내가 작성한 문서</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            최근 문서
          </h3>
          <Link href="/documents">
            <Button variant="link" size="sm">전체보기</Button>
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentDocs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center bg-slate-50 rounded-lg border border-dashed col-span-2">
              접근 가능한 문서가 없습니다.
            </div>
          ) : (
            recentDocs.map(doc => (
              <DocumentCard key={doc.id} doc={doc} onClick={() => handleOpenDoc(doc)} />
            ))
          )}
        </div>
      </section>

    </div>
  );
}

function DocumentCard({ doc, onClick }: { doc: Document, onClick: () => void }) {
  const getIcon = (type: string) => {
    if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  const getSecurityBadge = (level: string) => {
    switch (level) {
      case 'secret': return <Badge variant="destructive" className="text-[10px] h-5 px-1.5"><Lock className="w-3 h-3 mr-1"/>시크릿</Badge>;
      case 'important': return <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"><ShieldAlert className="w-3 h-3 mr-1"/>중요</Badge>;
      default: return <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-slate-500">일반</Badge>;
    }
  };

  return (
    <div 
      className="card-3d flex items-center p-3 rounded-lg border bg-card transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="mr-4 p-2 bg-slate-50 dark:bg-slate-900 rounded border">
        {getIcon(doc.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getSecurityBadge(doc.securityLevel)}
          <span className="text-xs text-muted-foreground truncate">{doc.authorName} • {new Date(doc.createdAt).toLocaleDateString()}</span>
        </div>
        <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.title}</h4>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
