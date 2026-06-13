import { AdminLayout } from "@/components/layout/admin-layout";
import { useListFloors, useCreateFloor, useUpdateFloor, useDeleteFloor, getListFloorsQueryKey, useCreateTable, useUpdateTable, useDeleteTable, getListTablesQueryKey, useListTables } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Plus, Trash2, Edit, LayoutGrid, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const floorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const tableSchema = z.object({
  number: z.coerce.number().min(1, "Table number is required"),
  seats: z.coerce.number().min(1, "Number of seats is required"),
  active: z.boolean().default(true),
});

export default function AdminFloors() {
  const { data: floors, isLoading: isLoadingFloors } = useListFloors();
  const { data: tables, isLoading: isLoadingTables } = useListTables();
  
  const queryClient = useQueryClient();
  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [isFloorDialogOpen, setIsFloorDialogOpen] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);

  const floorForm = useForm<z.infer<typeof floorSchema>>({
    resolver: zodResolver(floorSchema),
    defaultValues: { name: "" }
  });

  const tableForm = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: { number: 1, seats: 2, active: true }
  });

  // Handle floor switching properly when data loads
  if (floors?.length && !activeFloorId) {
    setActiveFloorId(floors[0].id.toString());
  }

  // --- Floor Actions ---
  const openNewFloorDialog = () => {
    setEditingFloorId(null);
    floorForm.reset({ name: "" });
    setIsFloorDialogOpen(true);
  };

  const openEditFloorDialog = (floor: any) => {
    setEditingFloorId(floor.id);
    floorForm.reset({ name: floor.name });
    setIsFloorDialogOpen(true);
  };

  const handleFloorSubmit = (data: z.infer<typeof floorSchema>) => {
    if (editingFloorId) {
      updateFloor.mutate({ id: editingFloorId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFloorsQueryKey() });
          setIsFloorDialogOpen(false);
          toast.success("Floor updated");
        }
      });
    } else {
      createFloor.mutate({ data }, {
        onSuccess: (newFloor) => {
          queryClient.invalidateQueries({ queryKey: getListFloorsQueryKey() });
          setActiveFloorId(newFloor.id.toString());
          setIsFloorDialogOpen(false);
          toast.success("Floor created");
        }
      });
    }
  };

  const handleDeleteFloor = (id: number) => {
    if (confirm("Are you sure you want to delete this floor? All tables on it will also be deleted.")) {
      deleteFloor.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFloorsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          if (activeFloorId === id.toString()) {
            setActiveFloorId("");
          }
          toast.success("Floor deleted");
        }
      });
    }
  };

  // --- Table Actions ---
  const openNewTableDialog = () => {
    if (!activeFloorId) return;
    setEditingTableId(null);
    tableForm.reset({ number: 1, seats: 4, active: true });
    setIsTableDialogOpen(true);
  };

  const openEditTableDialog = (table: any) => {
    setEditingTableId(table.id);
    tableForm.reset({ 
      number: table.number, 
      seats: table.seats, 
      active: table.active 
    });
    setIsTableDialogOpen(true);
  };

  const handleTableSubmit = (data: z.infer<typeof tableSchema>) => {
    const floorId = parseInt(activeFloorId);
    if (!floorId) return;

    if (editingTableId) {
      updateTable.mutate({ id: editingTableId, data: { ...data, floorId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          setIsTableDialogOpen(false);
          toast.success("Table updated");
        }
      });
    } else {
      createTable.mutate({ data: { ...data, floorId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          setIsTableDialogOpen(false);
          toast.success("Table created");
        }
      });
    }
  };

  const handleDeleteTable = (id: number) => {
    if (confirm("Are you sure you want to delete this table?")) {
      deleteTable.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() });
          toast.success("Table deleted");
        }
      });
    }
  };

  const activeFloorTables = tables?.filter(t => t.floorId.toString() === activeFloorId) || [];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Floor Plan</h1>
            <p className="text-muted-foreground mt-1">Manage floors and table arrangements.</p>
          </div>
          <Button onClick={openNewFloorDialog} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Floor
          </Button>
        </div>

        {isLoadingFloors ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : floors?.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-border shadow-sm">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">No floors defined</h3>
            <p>Create your first floor to start adding tables.</p>
            <Button onClick={openNewFloorDialog} className="mt-4" variant="outline">
              Create Floor
            </Button>
          </div>
        ) : (
          <Tabs value={activeFloorId} onValueChange={setActiveFloorId} className="w-full">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-6">
              <TabsList className="bg-transparent h-auto p-0">
                {floors?.map(floor => (
                  <TabsTrigger 
                    key={floor.id} 
                    value={floor.id.toString()}
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-t-lg rounded-b-none border-b-0 px-6 py-2"
                  >
                    {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {activeFloorId && floors?.find(f => f.id.toString() === activeFloorId) && (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditFloorDialog(floors.find(f => f.id.toString() === activeFloorId))}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Rename Floor
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteFloor(parseInt(activeFloorId))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Floor
                  </Button>
                </div>
              )}
            </div>

            {floors?.map(floor => (
              <TabsContent key={floor.id} value={floor.id.toString()} className="mt-0 outline-none">
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Tables on {floor.name}</h3>
                  <Button onClick={openNewTableDialog} variant="secondary" size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Table
                  </Button>
                </div>
                
                {isLoadingTables ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                  </div>
                ) : activeFloorTables.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground bg-card/50 rounded-xl border border-border border-dashed">
                    No tables on this floor yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {activeFloorTables.map(table => (
                      <Card key={table.id} className={`overflow-hidden transition-all hover:shadow-md ${!table.active ? 'opacity-60' : ''}`}>
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-xl">T{table.number}</CardTitle>
                          <Switch 
                            checked={table.active} 
                            onCheckedChange={(checked) => 
                              updateTable.mutate({ 
                                id: table.id, 
                                data: { floorId: table.floorId, number: table.number, seats: table.seats, active: checked } 
                              }, {
                                onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTablesQueryKey() })
                              })
                            }
                          />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center text-muted-foreground text-sm mt-2">
                            <UsersIcon className="h-4 w-4 mr-2 opacity-70" />
                            {table.seats} seats
                          </div>
                        </CardContent>
                        <CardFooter className="p-2 border-t border-border bg-muted/20 flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEditTableDialog(table)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTable(table.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Floor Dialog */}
      <Dialog open={isFloorDialogOpen} onOpenChange={setIsFloorDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingFloorId ? "Edit Floor" : "New Floor"}</DialogTitle>
          </DialogHeader>
          <Form {...floorForm}>
            <form onSubmit={floorForm.handleSubmit(handleFloorSubmit)} className="space-y-4 pt-4">
              <FormField
                control={floorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Hall, Patio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFloorDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createFloor.isPending || updateFloor.isPending}>
                  {editingFloorId ? "Save Changes" : "Create Floor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingTableId ? "Edit Table" : "New Table"}</DialogTitle>
          </DialogHeader>
          <Form {...tableForm}>
            <form onSubmit={tableForm.handleSubmit(handleTableSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={tableForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Number</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={tableForm.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seats</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={tableForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsTableDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTable.isPending || updateTable.isPending}>
                  {editingTableId ? "Save Changes" : "Add Table"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}