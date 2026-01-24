import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { MOCK_CATEGORIES, MOCK_DOCUMENTS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, FileIcon, Lock, ShieldAlert, Folder, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, Category } from "@/lib/types";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Filter documents based on user level
  const accessibleDocs = MOCK_DOCUMENTS.filter(doc => {
    if (user?.level === 3) return true; // Admin sees all
    if (user?.level === 2) return doc.securityLevel !== 'secret'; // Staff sees Important + General
    return doc.securityLevel === 'general'; // General sees General only
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentDocs = accessibleDocs.slice(0, 4);

  const handleOpenDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">안녕하세요, {user?.name}님</h2>
        <p className="text-muted-foreground mt-1">
          현재 <Badge variant="outline" className="ml-1 font-mono">{user?.level === 3 ? "Admin (Lvl 3)" : user?.level === 2 ? "Staff (Lvl 2)" : "General (Lvl 1)"}</Badge> 권한으로 접속 중입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">총 접근 가능 문서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{accessibleDocs.length}</div>
            <p className="text-xs text-blue-100 mt-1">전체 문서 중 접근 가능한 파일</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">최근 업로드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{MOCK_DOCUMENTS.length}</div>
            <p className="text-xs text-muted-foreground mt-1">이번 달 신규 문서</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">내 문서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {MOCK_DOCUMENTS.filter(d => d.authorId === user?.id).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">내가 작성한 문서</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
          <div className="space-y-3">
            {recentDocs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                접근 가능한 문서가 없습니다.
              </div>
            ) : (
              recentDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onClick={() => handleOpenDoc(doc)} />
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              부서별 카테고리
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
             {MOCK_CATEGORIES.filter(c => !c.parentId).map(cat => (
               <Link href="/documents" key={cat.id}>
                 <div className="p-4 rounded-lg border bg-card hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium group-hover:text-primary transition-colors">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {MOCK_CATEGORIES.filter(c => c.parentId === cat.id).length} 하위 카테고리
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {cat.path}
                    </div>
                 </div>
               </Link>
             ))}
          </div>
        </section>
      </div>

      <DocumentViewer 
        document={selectedDoc} 
        open={viewerOpen} 
        onOpenChange={setViewerOpen} 
      />
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
      className="flex items-center p-3 rounded-lg border bg-card hover:shadow-md transition-all group cursor-pointer"
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
