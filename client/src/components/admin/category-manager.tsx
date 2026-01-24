import { useState } from "react";
import { Category } from "@/lib/types";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, Trash2, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [newCatName, setNewCatName] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;

    let path = newCatName;
    if (selectedParentId) {
      const parent = categories.find(c => c.id === selectedParentId);
      if (parent) {
        path = `${parent.path}/${newCatName}`;
      }
    }

    const newCat: Category = {
      id: `c${Date.now()}`,
      name: newCatName,
      parentId: selectedParentId,
      path: path
    };

    setCategories([...categories, newCat]);
    setNewCatName("");
    toast({
      title: "카테고리 생성 완료",
      description: `${path} 경로에 생성되었습니다.`
    });
  };

  const handleDelete = (id: string) => {
    // Check if has children
    if (categories.some(c => c.parentId === id)) {
      toast({
        variant: "destructive",
        title: "삭제 불가",
        description: "하위 카테고리가 있는 카테고리는 삭제할 수 없습니다."
      });
      return;
    }
    setCategories(categories.filter(c => c.id !== id));
  };

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
      <div className="border rounded-lg p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-500" />
          카테고리 구조
        </h3>
        <div className="space-y-1">
           <CategoryTree 
             categories={categories} 
             parentId={null} 
             selectedId={selectedParentId}
             onSelect={setSelectedParentId}
             onDelete={handleDelete}
           />
        </div>
      </div>

      <div className="space-y-6 p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-green-600" />
            새 카테고리 추가
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>상위 카테고리</Label>
              <div className="p-3 border rounded-md bg-muted text-sm flex items-center gap-2">
                <Folder className="w-4 h-4 text-muted-foreground" />
                {selectedParentId 
                  ? categories.find(c => c.id === selectedParentId)?.path 
                  : "(최상위 경로)"}
              </div>
              {selectedParentId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedParentId(null)}
                  className="text-xs h-6 text-muted-foreground"
                >
                  선택 해제 (최상위로 설정)
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>카테고리명</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="예: 전략기획팀" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Button onClick={handleAddCategory}>추가</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded text-sm text-blue-800 dark:text-blue-200">
          <h4 className="font-semibold mb-2">도움말</h4>
          <ul className="list-disc pl-4 space-y-1 opacity-80">
            <li>왼쪽 트리에서 카테고리를 선택하면 해당 카테고리의 하위로 생성됩니다.</li>
            <li>선택하지 않으면 최상위 카테고리로 생성됩니다.</li>
            <li>하위 카테고리가 있는 경우 삭제할 수 없습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CategoryTree({ 
  categories, 
  parentId, 
  level = 0, 
  selectedId, 
  onSelect,
  onDelete
}: { 
  categories: Category[], 
  parentId: string | null, 
  level?: number,
  selectedId: string | null,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void
}) {
  const children = categories.filter(c => c.parentId === parentId);

  if (children.length === 0) return null;

  return (
    <div className="space-y-1">
      {children.map(node => (
        <div key={node.id}>
          <div 
            className={cn(
              "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors group",
              selectedId === node.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-slate-200 dark:hover:bg-slate-800"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.id);
            }}
          >
            <div className="flex items-center gap-2">
              {categories.some(c => c.parentId === node.id) ? (
                <ChevronDown className="w-3 h-3 opacity-50" />
              ) : (
                <div className="w-3" />
              )}
              <Folder className={cn(
                "w-4 h-4", 
                selectedId === node.id ? "text-white" : "text-blue-500"
              )} />
              <span className="text-sm">{node.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                selectedId === node.id ? "text-white hover:text-white hover:bg-white/20" : "text-destructive hover:text-destructive hover:bg-destructive/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <CategoryTree 
            categories={categories} 
            parentId={node.id} 
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
