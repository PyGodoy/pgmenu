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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from 'lucide-react';
import { QRCodeGenerator } from "@/components/QrCodeGenerator"
import { motion, AnimatePresence } from "framer-motion";

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
  const [showQRCode, setShowQRCode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [openCategory, setOpenCategory] = useState<string | undefined>(undefined);

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

  const toggleItemActive = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ active: !item.active })
        .eq('id', item.id);

      if (error) throw error;

      // Atualizar localmente o estado do item sem recarregar todos os dados
      setMenuItems(currentItems =>
        currentItems.map(menuItem =>
          menuItem.id === item.id
            ? { ...menuItem, active: !menuItem.active }
            : menuItem
        )
      );

      toast({
        title: `Item ${item.active ? 'desativado' : 'ativado'} com sucesso!`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status do item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        .order('order_itens'); // Ordenar por `order_itens`
  
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

  // Agrupar itens do cardápio por categoria
  const groupedMenuItems = categories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

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

  // Função para reordenar as categorias
  const onDragEndCategories = (result: any) => {
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
        name: category.name,
        slug: category.slug,
        order: index,
      }));
  
      const { error } = await supabase
        .from('categories')
        .upsert(updates, { onConflict: 'id' });
  
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

  // Função para reordenar os itens
  const onDragEndItems = (result: any) => {
    const { destination, source, draggableId } = result;

    // Se o item for solto fora da lista, não faça nada
    if (!destination) return;

    // Se o item for solto no mesmo lugar, não faça nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Encontrar a categoria correspondente
    const categoryId = source.droppableId;
    const category = groupedMenuItems.find((cat) => cat.id.toString() === categoryId);

    if (!category) return;

    // Reordenar os itens da categoria
    const newItems = Array.from(category.items);
    const [removed] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, removed);

    // Atualizar o estado local
    const updatedCategories = groupedMenuItems.map((cat) =>
      cat.id.toString() === categoryId
        ? { ...cat, items: newItems }
        : cat
    );

    // Atualizar o estado global dos itens
    const updatedMenuItems = updatedCategories.flatMap((cat) => cat.items);
    setMenuItems(updatedMenuItems);

    // Atualizar a ordem no banco de dados
    updateItemOrder(newItems, categoryId);
  };

  // Função para atualizar a ordem dos itens no banco de dados
  const updateItemOrder = async (items: MenuItem[], categoryId: string) => {
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        name: item.name, // Certifique-se de que 'name' está presente
        price: item.price, // Adicione o campo 'price' ao objeto
        order_itens: index, // Atualize a posição do item
      }));
  
      // Verifique se algum item tem o campo 'name' ou 'price' faltando
      const invalidItems = updates.filter(item => !item.name || item.price == null);
      if (invalidItems.length > 0) {
        console.error("Items com 'name' ou 'price' inválido:", invalidItems);
        toast({
          title: "Erro ao atualizar a ordem dos itens",
          description: "Alguns itens não possuem nome ou preço válido.",
          variant: "destructive",
        });
        return;
      }
  
      console.log("Updates:", updates); // Verifique os dados que serão enviados
  
      const { error } = await supabase
        .from("menu_items")
        .upsert(updates, { onConflict: "id" });
  
      if (error) throw error;
  
      toast({
        title: "Ordem dos itens atualizada com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar a ordem dos itens:", error.message);
      toast({
        title: "Erro ao atualizar a ordem dos itens",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text text-center sm:text-left">Painel Administrativo</h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="mt-3 sm:mt-0 w-full sm:w-auto"
          style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
        >
          Sair
        </Button>
      </div>

      <div className="grid gap-6 sm:gap-8">
        {/* Categories Section */}
        <Card className="bg-background shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-0">Categorias</h2>
            <Button
              onClick={() => {
                setSelectedCategory(undefined);
                setCategoryDialogOpen(true);
              }}
              className="w-full sm:w-auto"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Adicionar Categoria
            </Button>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <DragDropContext onDragEnd={onDragEndCategories}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <Table ref={provided.innerRef} {...provided.droppableProps} className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-text text-sm">Nome</TableHead>
                          <TableHead className="text-text text-sm hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="text-text text-sm">Ações</TableHead>
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
                                className="bg-background text-text"
                              >
                                <TableCell className="py-2 text-sm sm:text-base">{category.name}</TableCell>
                                <TableCell className="py-2 text-sm hidden sm:table-cell">{category.slug}</TableCell>
                                <TableCell className="py-2">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full sm:w-auto text-xs"
                                      onClick={() => handleEditCategory(category)}
                                      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="w-full sm:w-auto text-xs"
                                      onClick={() => handleDeleteCategory(category)}
                                      style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                                    >
                                      Excluir
                                    </Button>
                                  </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Section */}
        <Card className="bg-background shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-0">Itens do Cardápio</h2>
            <Button
              onClick={() => {
                setSelectedMenuItem(undefined);
                setMenuItemDialogOpen(true);
              }}
              className="w-full sm:w-auto"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Accordion type="single" collapsible value={openCategory} onValueChange={setOpenCategory} className="w-full">
              {groupedMenuItems.map((category) => (
                <AccordionItem key={category.id} value={category.id.toString()}>
                  <AccordionTrigger className="px-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-1 sm:gap-0">
                      <span className="text-text font-medium">{category.name}</span>
                      <span className="text-xs sm:text-sm text-text opacity-80">{category.items.length} itens</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <DragDropContext onDragEnd={onDragEndItems}>
                        <Droppable droppableId={category.id.toString()}>
                          {(provided) => (
                            <Table ref={provided.innerRef} {...provided.droppableProps} className="w-full">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-text text-sm">Nome</TableHead>
                                  <TableHead className="text-text text-sm">Preço</TableHead>
                                  <TableHead className="text-text text-sm hidden sm:table-cell">Status</TableHead>
                                  <TableHead className="text-text text-sm">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {category.items.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                                    {(provided) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={!item.active ? "opacity-60 bg-background text-text" : "bg-background text-text"}
                                      >
                                        <TableCell className="py-2 text-sm sm:text-base">{item.name}</TableCell>
                                        <TableCell className="py-2 text-sm whitespace-nowrap">
                                          {new Intl.NumberFormat("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                          }).format(item.price)}
                                        </TableCell>
                                        <TableCell className="py-2 hidden sm:table-cell">
                                          <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                              item.active
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                            }`}
                                          >
                                            {item.active ? "Ativo" : "Desativado"}
                                          </span>
                                        </TableCell>
                                        <TableCell className="py-2">
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full sm:w-auto text-xs"
                                              onClick={() => handleEditMenuItem(item)}
                                              style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                                            >
                                              Editar
                                            </Button>
                                            <Button
                                              variant={item.active ? "secondary" : "default"}
                                              size="sm"
                                              className="w-full sm:w-auto text-xs"
                                              onClick={() => toggleItemActive(item)}
                                              style={{ backgroundColor: item.active ? 'var(--primary)' : 'var(--background)', color: item.active ? 'var(--background)' : 'var(--text)' }}
                                            >
                                              {item.active ? "Desativar" : "Ativar"}
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              className="w-full sm:w-auto text-xs"
                                              onClick={() => handleDeleteMenuItem(item)}
                                              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                                            >
                                              Excluir
                                            </Button>
                                          </div>
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
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

      {/* Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background max-w-xs sm:max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-text">
              {categoryToDelete
                ? "Tem certeza que deseja excluir esta categoria?"
                : "Tem certeza que deseja excluir este item?"}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-background text-text border-secondary w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={categoryToDelete ? confirmDeleteCategory : confirmDeleteMenuItem}
              className="bg-primary text-background w-full sm:w-auto"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Button - Updated with text-primary */}
      <Button
        onClick={() => setShowQRCode(!showQRCode)}
        className="mt-6 w-full sm:w-auto bg-primary text-primary"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
      >
        {showQRCode ? "Ocultar QR Code" : "Mostrar QR Code"}
      </Button>

      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex justify-center"
          >
            <QRCodeGenerator />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

export default Admin;