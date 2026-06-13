import { AdminLayout } from "@/components/layout/admin-layout";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const PRESET_COLORS = [
  "#e11d48", // Rose
  "#d97706", // Amber
  "#16a34a", // Green
  "#2563eb", // Blue
  "#7c3aed", // Indigo
  "#9333ea", // Violet
  "#475569", // Slate
];

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories();
  const queryClient = useQueryClient();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  const handleEdit = (id: number, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleNew = () => {
    setEditingId("new");
    setEditName("");
    setEditColor(PRESET_COLORS[0]);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editingId === "new") {
      createCategory.mutate({ data: { name: editName, color: editColor } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setEditingId(null);
          toast.success("Category created");
        }
      });
    } else if (editingId !== null) {
      updateCategory.mutate({ id: editingId, data: { name: editName, color: editColor } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setEditingId(null);
          toast.success("Category updated");
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategory.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast.success("Category deleted");
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Organize your products into groups.</p>
          </div>
          <Button onClick={handleNew} disabled={editingId !== null} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingId === "new" && (
                <TableRow className="bg-muted/30">
                  <TableCell>
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      placeholder="Category name"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`w-6 h-6 rounded-full border-2 ${editColor === c ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={handleSave} disabled={createCategory.isPending}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : categories?.length === 0 && editingId !== "new" ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">
                      {editingId === cat.id ? (
                        <Input 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          autoFocus
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === cat.id ? (
                        <div className="flex gap-1">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setEditColor(c)}
                              className={`w-6 h-6 rounded-full border-2 ${editColor === c ? 'border-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs uppercase">{cat.color}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === cat.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={handleSave} disabled={updateCategory.isPending}>
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(cat.id, cat.name, cat.color)}
                            disabled={editingId !== null}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive" 
                            onClick={() => handleDelete(cat.id)}
                            disabled={editingId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}