import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Document } from "@/lib/types";
import { Download, Share2, Printer, X, FileText } from "lucide-react";

interface DocumentViewerProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewer({ document, open, onOpenChange }: DocumentViewerProps) {
  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white dark:bg-slate-800 rounded border">
                <FileText className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <DialogTitle className="text-base font-semibold flex items-center gap-2">
                 {document.title}
                 {document.securityLevel === 'secret' && <Badge variant="destructive" className="h-5 text-[10px]">Secret</Badge>}
               </DialogTitle>
               <DialogDescription className="text-xs mt-0.5">
                 {document.authorName} • {new Date(document.createdAt).toLocaleDateString()} • {document.size}
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
            <Button size="sm" className="h-8 gap-2 ml-2">
              <Download className="w-3.5 h-3.5" />
              다운로드
            </Button>
          </div>
        </div>
        
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-hidden relative">
           {/* Mock Webview Content */}
           <div className="w-full h-full bg-white dark:bg-slate-900 shadow-sm border rounded-lg overflow-y-auto p-8 md:p-12">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse delay-75" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse delay-100" />
                  <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse delay-150" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse delay-200" />
                </div>
                
                <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed flex items-center justify-center text-muted-foreground text-sm my-8">
                  [ 문서 미리보기 이미지 / 차트 영역 ]
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                  <div className="h-4 w-11/12 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                </div>
              </div>
           </div>
           
           <div className="absolute bottom-6 right-6 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
             Page 1 / 3
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
