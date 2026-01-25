import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Category, Document } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documentApi, categoryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
      const allIds = new Set(cats.map(c => c.id));
      setExpandedCategories(allIds);
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

  const buildCategoryTree = (cats: Category[]): (Category & { children?: Category[] })[] => {
    const map = new Map<string, Category & { children?: Category[] }>();
    const roots: (Category & { children?: Category[] })[] = [];

    cats.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    cats.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const categoryTree = buildCategoryTree(categories);

  const getAllChildIds = (id: string): string[] => {
    const directChildren = categories.filter(c => c.parentId === id);
    return [id, ...directChildren.flatMap(c => getAllChildIds(c.id))];
  };

  const filteredDocs = documents.filter(doc => {
    if (selectedCategoryId) {
      const relevantIds = getAllChildIds(selectedCategoryId);
      if (!relevantIds.includes(doc.categoryId)) return false;
    }
    if (searchTerm) {
      if (!doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !doc.authorName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const handleOpenDoc = (doc: Document) => {
    setLocation(`/documents/${doc.id}`);
  };

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const getSecurityLabel = (level: string) => {
    switch (level) {
      case 'secret': return '대외비';
      case 'important': return '중요';
      default: return '일반';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'excel': return 'Excel';
      case 'ms_word': return 'Word';
      case 'hwp': return 'HWP';
      case 'image': return '이미지';
      case 'text': return '텍스트';
      default: return type.toUpperCase();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs">로딩 중...</div>;
  }

  const renderCategoryRows = (nodes: (Category & { children?: Category[] })[], level: number = 0): JSX.Element[] => {
    const rows: JSX.Element[] = [];
    
    nodes.forEach(node => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedCategories.has(node.id);
      const isSelected = selectedCategoryId === node.id;
      
      rows.push(
        <TableRow 
          key={`cat-${node.id}`}
          className={cn(
            "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
            isSelected && "bg-blue-50 dark:bg-blue-900/30"
          )}
          onClick={() => setSelectedCategoryId(isSelected ? null : node.id)}
        >
          <TableCell 
            colSpan={6} 
            className="py-1 text-xs font-medium bg-slate-50 dark:bg-slate-900"
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <div className="flex items-center gap-1">
              {hasChildren ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleCategory(node.id); }}
                  className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              ) : (
                <span className="w-4" />
              )}
              <Folder className="w-3 h-3 text-blue-500" />
              <span>{node.name}</span>
              <span className="text-muted-foreground ml-1">
                ({documents.filter(d => getAllChildIds(node.id).includes(d.categoryId)).length})
              </span>
            </div>
          </TableCell>
        </TableRow>
      );

      if (isExpanded && hasChildren) {
        rows.push(...renderCategoryRows(node.children!, level + 1));
      }

      if (isExpanded || isSelected) {
        const categoryDocs = filteredDocs.filter(d => d.categoryId === node.id);
        categoryDocs.forEach(doc => {
          rows.push(
            <TableRow 
              key={`doc-${doc.id}`}
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => handleOpenDoc(doc)}
            >
              <TableCell className="py-1 text-xs" style={{ paddingLeft: `${level * 16 + 32}px` }}>
                {doc.title}
              </TableCell>
              <TableCell className="py-1 text-xs text-center">{getTypeLabel(doc.type)}</TableCell>
              <TableCell className={cn(
                "py-1 text-xs text-center",
                doc.securityLevel === 'secret' && "text-red-600 font-medium",
                doc.securityLevel === 'important' && "text-amber-600 font-medium"
              )}>
                {getSecurityLabel(doc.securityLevel)}
              </TableCell>
              <TableCell className="py-1 text-xs text-center">{doc.authorName}</TableCell>
              <TableCell className="py-1 text-xs text-center">{doc.size || '-'}</TableCell>
              <TableCell className="py-1 text-xs text-center">
                {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
              </TableCell>
            </TableRow>
          );
        });
      }
    });

    return rows;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">문서함</h2>
        </div>
        <div className="relative w-48">
          <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="검색..." 
            className="pl-7 h-6 text-xs" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 dark:bg-slate-800">
              <TableHead className="py-1 text-xs font-bold h-7 w-[40%]">문서명</TableHead>
              <TableHead className="py-1 text-xs font-bold h-7 text-center w-[10%]">형식</TableHead>
              <TableHead className="py-1 text-xs font-bold h-7 text-center w-[10%]">보안</TableHead>
              <TableHead className="py-1 text-xs font-bold h-7 text-center w-[15%]">작성자</TableHead>
              <TableHead className="py-1 text-xs font-bold h-7 text-center w-[10%]">크기</TableHead>
              <TableHead className="py-1 text-xs font-bold h-7 text-center w-[15%]">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCategoryId === null && searchTerm === "" ? (
              renderCategoryRows(categoryTree)
            ) : searchTerm !== "" ? (
              filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map(doc => (
                  <TableRow 
                    key={doc.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => handleOpenDoc(doc)}
                  >
                    <TableCell className="py-1 text-xs">{doc.title}</TableCell>
                    <TableCell className="py-1 text-xs text-center">{getTypeLabel(doc.type)}</TableCell>
                    <TableCell className={cn(
                      "py-1 text-xs text-center",
                      doc.securityLevel === 'secret' && "text-red-600 font-medium",
                      doc.securityLevel === 'important' && "text-amber-600 font-medium"
                    )}>
                      {getSecurityLabel(doc.securityLevel)}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center">{doc.authorName}</TableCell>
                    <TableCell className="py-1 text-xs text-center">{doc.size || '-'}</TableCell>
                    <TableCell className="py-1 text-xs text-center">
                      {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : (
              renderCategoryRows(categoryTree)
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
        <span>전체 {documents.length}개 문서</span>
        <span>
          {selectedCategoryId ? `선택: ${categories.find(c => c.id === selectedCategoryId)?.name}` : '전체 보기'}
        </span>
      </div>
    </div>
  );
}
