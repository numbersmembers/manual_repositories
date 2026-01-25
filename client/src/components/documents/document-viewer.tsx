import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Document } from "@/lib/types";
import { Download, Share2, Printer, X, FileText, Image, FileSpreadsheet, File } from "lucide-react";

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDocumentIcon(type: string) {
  switch (type) {
    case 'image': return <Image className="w-5 h-5 text-green-600" />;
    case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    case 'pdf': return <FileText className="w-5 h-5 text-red-600" />;
    default: return <File className="w-5 h-5 text-blue-600" />;
  }
}

function handleDownload(doc: Document) {
  if (doc.url && doc.url !== '#') {
    window.open(doc.url, '_blank');
  } else {
    const element = document.createElement('a');
    const content = `문서 제목: ${doc.title}\n작성자: ${doc.authorName}\n등록일: ${new Date(doc.createdAt).toLocaleDateString('ko-KR')}\n파일 형식: ${doc.type}\n\n(실제 파일 콘텐츠는 별도 저장소에서 관리됩니다)`;
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

export function DocumentViewer({ document: doc, open, onOpenChange }: DocumentViewerProps) {
  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                {getDocumentIcon(doc.type)}
             </div>
             <div>
               <DialogTitle className="text-base font-semibold flex items-center gap-2">
                 {doc.title}
                 {doc.securityLevel === 'secret' && <Badge variant="destructive" className="h-5 text-[10px]">Secret</Badge>}
               </DialogTitle>
               <DialogDescription className="text-xs mt-0.5">
                 {doc.authorName} • {new Date(doc.createdAt).toLocaleDateString()} • {doc.size}
               </DialogDescription>
             </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="h-8 gap-2 ml-2"
              onClick={() => handleDownload(doc)}
              data-testid="button-download"
            >
              <Download className="w-3.5 h-3.5" />
              다운로드
            </Button>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 ml-2"
                data-testid="button-close-preview"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </div>
        
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-hidden relative">
           <div className="w-full h-full bg-white dark:bg-slate-900 shadow-sm border rounded-lg overflow-y-auto p-8 md:p-12">
              <div className="max-w-2xl mx-auto">
                <div className="text-center space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-lg inline-block">
                    {getDocumentIcon(doc.type)}
                    <div className="mt-2 text-sm font-medium">{doc.type.toUpperCase()}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{doc.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      작성자: {doc.authorName}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      등록일: {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    {doc.size && (
                      <p className="text-muted-foreground text-sm">
                        파일 크기: {doc.size}
                      </p>
                    )}
                  </div>

                  <div className="p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    <p className="text-sm">
                      이 문서의 미리보기를 보려면 다운로드 버튼을 클릭하세요.
                    </p>
                    <p className="text-xs mt-2 opacity-70">
                      (현재 버전에서는 파일 미리보기가 지원되지 않습니다)
                    </p>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
