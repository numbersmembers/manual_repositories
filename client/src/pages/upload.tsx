import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { MOCK_CATEGORIES, buildCategoryTree } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [securityLevel, setSecurityLevel] = useState("general");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      // Auto-fill title if empty
      if (!title) setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !categoryId) {
      toast({
        variant: "destructive",
        title: "필수 정보 누락",
        description: "파일, 문서 제목, 카테고리를 모두 입력해주세요."
      });
      return;
    }

    setUploading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUploading(false);
    toast({
      title: "업로드 성공",
      description: "문서가 성공적으로 등록되었습니다."
    });
    
    // Reset form
    setFile(null);
    setTitle("");
    setSecurityLevel("general");
    // Keep categoryId as users might upload multiple files to same cat
  };

  // Flattened categories for select with indentation
  const flattenedCategories = () => {
    const list: { id: string, name: string, level: number }[] = [];
    const traverse = (parentId: string | null, level: number) => {
      const children = MOCK_CATEGORIES.filter(c => c.parentId === parentId);
      children.forEach(c => {
        list.push({ id: c.id, name: c.name, level });
        traverse(c.id, level + 1);
      });
    };
    traverse(null, 0);
    return list;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">파일 업로드</h2>
        <p className="text-muted-foreground">새로운 업무 문서를 등록합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>문서 정보 입력</CardTitle>
          <CardDescription>
            문서의 접근 권한과 분류를 정확하게 설정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* File Dropzone */}
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative",
              dragActive ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900",
              file ? "bg-green-50 dark:bg-green-900/10 border-green-200" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-medium text-lg">{file.name}</div>
                <div className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  파일 제거
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="font-medium text-lg">파일을 드래그하거나 클릭하여 선택</div>
                <div className="text-sm text-muted-foreground">
                  PDF, Word, Excel, HWP 등 모든 형식 지원
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">문서 제목</Label>
              <Input 
                id="title" 
                placeholder="예: 2026년 상반기 마케팅 기획안_v2.pdf" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {flattenedCategories().map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span style={{ paddingLeft: `${cat.level * 10}px` }}>
                          {cat.level > 0 && '└ '} {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>보안 등급</Label>
                <Select value={securityLevel} onValueChange={setSecurityLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        일반 (모든 사용자)
                      </div>
                    </SelectItem>
                    <SelectItem value="important">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        중요 (Staff 이상)
                      </div>
                    </SelectItem>
                    <SelectItem value="secret">
                       <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        시크릿 (Admin 전용)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {securityLevel === 'secret' && "관리자(Level 3)만 접근 가능합니다."}
                  {securityLevel === 'important' && "스태프(Level 2) 이상만 접근 가능합니다."}
                  {securityLevel === 'general' && "모든 사용자(Level 1 이상)가 접근 가능합니다."}
                </p>
              </div>
            </div>
          </div>

          {securityLevel === 'secret' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg text-sm border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong>주의: 시크릿 문서입니다.</strong>
                <p>이 문서는 최고 관리자 등급만 열람할 수 있으며, 모든 접근 기록이 별도로 관리됩니다.</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
             <Button variant="outline" onClick={() => setFile(null)}>취소</Button>
             <Button onClick={handleUpload} disabled={uploading || !file}>
               {uploading ? "업로드 중..." : "업로드 하기"}
             </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
