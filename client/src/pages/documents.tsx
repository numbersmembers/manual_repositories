import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Category, Document } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Search,
  Filter,
  FileSpreadsheet,
  FileIcon,
  Eye,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { documentApi, categoryApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function DocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
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

  const buildCategoryTree = (cats: Category[]): Category[] => {
    const map = new Map<string, Category & { children?: Category[] }>();
    const roots: Category[] = [];

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

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    // 1. Category Filter
    if (selectedCategoryId) {
       // Finding all children IDs of selected category
       const getAllChildIds = (id: string): string[] => {
         const directChildren = categories.filter(c => c.parentId === id);
         return [id, ...directChildren.flatMap(c => getAllChildIds(c.id))];
       };
       const relevantIds = getAllChildIds(selectedCategoryId);
       if (!relevantIds.includes(doc.categoryId)) return false;
    }

    // 2. Search Term
    if (searchTerm) {
      if (!doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !doc.authorName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const handleOpenDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">문서함</h2>
          <p className="text-muted-foreground">카테고리별 문서를 탐색하세요.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative w-64">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="문서 검색..." 
               className="pl-9" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <Button variant="outline" size="icon">
             <Filter className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar: Category Tree */}
        <Card className="w-64 flex flex-col overflow-hidden border-none shadow-none bg-slate-50/50 dark:bg-slate-900/20">
          <div className="p-4 border-b font-medium text-sm flex items-center text-muted-foreground">
            <Folder className="w-4 h-4 mr-2" />
            폴더 구조
          </div>
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              <Button
                variant={selectedCategoryId === null ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => setSelectedCategoryId(null)}
              >
                <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
                전체 문서
              </Button>
              {categoryTree.map(node => (
                <CategoryNode 
                  key={node.id} 
                  node={node} 
                  selectedId={selectedCategoryId} 
                  onSelect={setSelectedCategoryId} 
                />
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Main: Document List */}
        <Card className="flex-1 flex flex-col border-none shadow-none bg-transparent">
           <div className="flex-1 overflow-auto rounded-lg border bg-card">
              {filteredDocs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                  <p>표시할 문서가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      className="flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDoc(doc)}
                    >
                      <div className="mr-4 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                         {doc.type.includes('excel') ? <FileSpreadsheet className="w-5 h-5 text-green-600"/> : 
                          doc.type.includes('pdf') ? <FileText className="w-5 h-5 text-red-600"/> : 
                          <FileIcon className="w-5 h-5"/>}
                      </div>
                      
                      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6">
                           <div className="flex items-center gap-2 mb-1">
                             {doc.securityLevel === 'secret' && <Badge variant="destructive" className="h-4 text-[10px] px-1 py-0">Secret</Badge>}
                             {doc.securityLevel === 'important' && <Badge variant="outline" className="h-4 text-[10px] px-1 py-0 text-orange-600 border-orange-200 bg-orange-50">Important</Badge>}
                             <span className="text-xs text-muted-foreground flex items-center gap-1">
                               <Folder className="w-3 h-3" />
                               {categories.find(c => c.id === doc.categoryId)?.path}
                             </span>
                           </div>
                           <h3 className="font-medium truncate pr-4 text-base group-hover:text-primary transition-colors">
                             {doc.title}
                           </h3>
                        </div>
                        
                        <div className="col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                             {doc.authorName[0]}
                           </div>
                           {doc.authorName}
                        </div>
                        
                        <div className="col-span-3 text-sm text-muted-foreground text-right">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                           <Eye className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                           <Download className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </Card>
      </div>

      <DocumentViewer 
        document={selectedDoc} 
        open={viewerOpen} 
        onOpenChange={setViewerOpen} 
      />
    </div>
  );
}

function CategoryNode({ 
  node, 
  selectedId, 
  onSelect,
  level = 0
}: { 
  node: Category & { children?: Category[] }, 
  selectedId: string | null, 
  onSelect: (id: string) => void,
  level?: number
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <Button
        variant={selectedId === node.id ? "secondary" : "ghost"}
        size="sm"
        className={cn("w-full justify-start font-normal h-8", selectedId === node.id && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300")}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren && (
          <div 
            className="p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>
        )}
        {!hasChildren && <span className="w-4 mr-1" />}
        
        {expanded ? <FolderOpen className="w-3.5 h-3.5 mr-2 text-blue-500" /> : <Folder className="w-3.5 h-3.5 mr-2 text-blue-500" />}
        <span className="truncate">{node.name}</span>
      </Button>
      
      {expanded && hasChildren && (
        <div className="border-l ml-3 pl-1 border-slate-100 dark:border-slate-800">
          {node.children!.map(child => (
            <CategoryNode 
              key={child.id} 
              node={child} 
              selectedId={selectedId} 
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
