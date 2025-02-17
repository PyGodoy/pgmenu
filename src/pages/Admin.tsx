import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { MenuItem, Category } from '@/types';
import { CategoryDialog } from '@/components/CategoryDialog';
import { MenuItemDialog } from '@/components/MenuItemDialog';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const Admin = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_admin) {
        navigate('/login');
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
  
      // Obter usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
  
      // Buscar ID do restaurante associado ao usuário logado
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', session.user.id)
        .maybeSingle();
  
      if (restaurantError) throw restaurantError;
      if (!restaurant) {
        throw new Error("Nenhum restaurante encontrado para este usuário.");
      }
  
      const restaurantId = restaurant.id;
  
      // Buscar categorias filtrando pelo restaurante
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('order');
  
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);
  
      // Buscar itens do menu filtrando pelo restaurante
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('*, category:categories(name)')
        .eq('restaurant_id', restaurantId) // 🔹 Filtrando pelo restaurante correto
        .order('name');
  
      if (menuItemsError) throw menuItemsError;
      setMenuItems(menuItemsData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({
        title: "Categoria excluída com sucesso!",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setMenuItemDialogOpen(true);
  };

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    setMenuItemToDelete(menuItem);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMenuItem = async () => {
    if (!menuItemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', menuItemToDelete.id);

      if (error) throw error;

      toast({
        title: "Item excluído com sucesso!",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setMenuItemToDelete(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedCategories = Array.from(categories);
    const [removed] = reorderedCategories.splice(result.source.index, 1);
    reorderedCategories.splice(result.destination.index, 0, removed);

    setCategories(reorderedCategories);

    // Atualizar a ordem no banco de dados
    updateCategoryOrder(reorderedCategories);
  };

  const updateCategoryOrder = async (reorderedCategories: Category[]) => {
    try {
      const updates = reorderedCategories.map((category, index) => ({
        id: category.id,
        name: category.name, // Adiciona o nome
        slug: category.slug, // Adiciona o slug
        order: index, // Mantém a posição
      }));
  
      // Usar .update() para atualizar apenas a coluna `order`
      const { error } = await supabase
        .from('categories')
        .upsert(updates, { onConflict: 'id' }); // Usar onConflict para garantir que apenas a ordem seja atualizada
  
      if (error) throw error;
  
      toast({
        title: "Ordem das categorias atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar a ordem das categorias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        <div className="grid gap-8">
          {/* Categories Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-2xl font-semibold">Categorias</h2>
              <Button onClick={() => {
                setSelectedCategory(undefined);
                setCategoryDialogOpen(true);
              }}>
                Adicionar Categoria
              </Button>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <Table ref={provided.innerRef} {...provided.droppableProps}>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category, index) => (
                          <Draggable key={category.id} draggableId={category.id.toString()} index={index}>
                            {(provided) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.slug}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category)}
                                  >
                                    Excluir
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    </Table>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>

          {/* Menu Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-2xl font-semibold">Itens do Cardápio</h2>
              <Button onClick={() => {
                setSelectedMenuItem(undefined);
                setMenuItemDialogOpen(true);
              }}>
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(item.price)}
                      </TableCell>
                      <TableCell>{(item as any).category?.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEditMenuItem(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteMenuItem(item)}
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          category={selectedCategory}
          onSuccess={fetchData}
        />

        <MenuItemDialog
          open={menuItemDialogOpen}
          onOpenChange={setMenuItemDialogOpen}
          menuItem={selectedMenuItem}
          categories={categories}
          onSuccess={fetchData}
        />

        <AlertDialog 
          open={deleteDialogOpen} 
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {categoryToDelete 
                  ? "Tem certeza que deseja excluir esta categoria?" 
                  : "Tem certeza que deseja excluir este item?"} 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={categoryToDelete ? confirmDeleteCategory : confirmDeleteMenuItem}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Admin;