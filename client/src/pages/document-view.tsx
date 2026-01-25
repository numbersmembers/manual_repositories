import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Document, Category, Comment } from "@/lib/types";
import { documentApi, categoryApi, commentApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Share2, Printer, FileText, Image, FileSpreadsheet, File, MessageSquare, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getDocumentIcon(type: string, size: "sm" | "lg" = "sm") {
  const sizeClass = size === "lg" ? "w-12 h-12" : "w-5 h-5";
  switch (type) {
    case 'image': return <Image className={`${sizeClass} text-green-600`} />;
    case 'excel': return <FileSpreadsheet className={`${sizeClass} text-emerald-600`} />;
    case 'pdf': return <FileText className={`${sizeClass} text-red-600`} />;
    default: return <File className={`${sizeClass} text-blue-600`} />;
  }
}

function getSecurityBadge(level: string) {
  switch (level) {
    case 'secret': return <Badge variant="destructive">대외비</Badge>;
    case 'important': return <Badge className="bg-amber-500 hover:bg-amber-600">중요</Badge>;
    default: return <Badge variant="outline">일반</Badge>;
  }
}

function getFileExtension(type: string, originalUrl?: string): string {
  if (originalUrl && originalUrl !== '#') {
    const ext = originalUrl.split('.').pop();
    if (ext) return `.${ext}`;
  }
  switch (type) {
    case 'pdf': return '.pdf';
    case 'excel': return '.xlsx';
    case 'ms_word': return '.docx';
    case 'hwp': return '.hwp';
    case 'image': return '.png';
    case 'text': return '.txt';
    default: return '';
  }
}

function handleDownload(doc: Document) {
  if (doc.fileData) {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.url && doc.url !== '#' ? doc.url : `${doc.title}${getFileExtension(doc.type, doc.url)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert('이 문서는 파일 데이터가 저장되지 않았습니다. 새로 업로드된 문서만 다운로드가 가능합니다.');
  }
}

export default function DocumentViewPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [doc, setDoc] = useState<Document | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        const document = await documentApi.getById(params.id);
        setDoc(document);
        
        const [categories, docComments] = await Promise.all([
          categoryApi.getAll(),
          commentApi.getByDocument(params.id)
        ]);
        const cat = categories.find(c => c.id === document.categoryId);
        if (cat) setCategory(cat);
        setComments(docComments);
      } catch (err: any) {
        setError(err.message || "문서를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    
    if (params.id) {
      loadDocument();
    }
  }, [params.id]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !params.id) return;
    
    setSubmitting(true);
    try {
      const comment = await commentApi.create(params.id, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment("");
      toast({ title: "댓글이 등록되었습니다." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "댓글 등록 실패", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: "댓글이 삭제되었습니다." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "댓글 삭제 실패", description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">문서 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">{error || "문서를 찾을 수 없습니다."}</p>
        <Button variant="outline" onClick={() => setLocation("/documents")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          문서 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="document-view-page">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/documents")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          문서 목록
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            인쇄
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            공유
          </Button>
          <Button 
            size="sm"
            onClick={() => handleDownload(doc)}
            data-testid="button-download"
          >
            <Download className="w-4 h-4 mr-2" />
            다운로드
          </Button>
        </div>
      </div>

      <Card className="card-3d">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                {getDocumentIcon(doc.type, "lg")}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{doc.title}</h1>
                  <p className="text-muted-foreground mt-1">
                    {category?.path || "분류 없음"}
                  </p>
                </div>
                {getSecurityBadge(doc.securityLevel)}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">작성자</p>
                  <p className="font-medium">{doc.authorName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">등록일</p>
                  <p className="font-medium">{new Date(doc.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">파일 형식</p>
                  <p className="font-medium">{doc.type.toUpperCase()}</p>
                </div>
                {doc.size && (
                  <div>
                    <p className="text-xs text-muted-foreground">파일 크기</p>
                    <p className="font-medium">{doc.size}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-3d">
        <CardContent className="p-8">
          <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900">
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">문서 미리보기</p>
              <p className="text-sm mt-2">
                이 문서를 보려면 다운로드 버튼을 클릭하세요.
              </p>
              <p className="text-xs mt-1 opacity-70">
                (현재 버전에서는 파일 미리보기가 지원되지 않습니다)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-3d">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            댓글 ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 min-h-[80px] resize-none"
              data-testid="input-comment"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="btn-3d self-end"
              data-testid="button-submit-comment"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">아직 댓글이 없습니다.</p>
              <p className="text-xs mt-1">첫 번째 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  data-testid={`comment-item-${comment.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium flex-shrink-0">
                    {comment.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      {user?.level === 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                          data-testid={`button-delete-comment-${comment.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
