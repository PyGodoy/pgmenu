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
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/components/QrCodeGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import { QRCodeSVG } from 'qrcode.react';
import { TableOrders } from "@/components/TableOrders";
import Navbar from '@/components/Navbar';

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
  const [restaurant, setRestaurant] = useState<any>(null);
  const [tables, setTables] = useState<{ id: string; tableNumber: number; token: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("produtos");

  useEffect(() => {
    const fetchRestaurantAndTables = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (!userId) {
          navigate('/login');
          return;
        }

        // Buscar o ID do restaurante associado ao usuário logado
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('restaurant_id')
          .eq('id', userId)
          .single();

        if (profileError || !profile?.restaurant_id) {
          console.error("Erro ao buscar o restaurante:", profileError);
          return;
        }

        // Buscar os dados do restaurante usando o ID correto
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", profile.restaurant_id)
          .single();

        if (restaurantError) {
          console.error("Erro ao buscar os dados do restaurante:", restaurantError);
          return;
        }

        // Definir o restaurante no estado
        setRestaurant(restaurantData);

        // Buscar as mesas associadas a este restaurante
        const { data: tablesData, error: tablesError } = await supabase
          .from('tables')
          .select('*')
          .eq('restaurant_id', restaurantData.id);

        if (tablesError) {
          console.error("Erro ao buscar mesas:", tablesError);
          return;
        }

        // Mapear os dados das mesas para o formato esperado pelo componente
        const formattedTables = tablesData.map(table => ({
          id: table.id,
          tableNumber: table.table_number,
          token: table.token
        }));

        // Atualizar o estado com as mesas existentes
        setTables(formattedTables);

        // Buscar os pedidos
        fetchOrders();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao buscar os dados do restaurante e mesas.",
          variant: "destructive",
        });
      }
    };

    fetchRestaurantAndTables();
  }, [navigate, toast]);

  const handleFinalizeTable = async (tableToken: string) => {
    try {
      // 1. Primeiro deleta todos os pedidos associados à mesa
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('table_token', tableToken);
  
      if (deleteError) throw deleteError;
  
      // 2. Encontra a mesa correspondente
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('token', tableToken)
        .single();
  
      if (tableError) throw tableError;
      if (!tableData) throw new Error("Mesa não encontrada");
  
      // 3. Gera um novo token para a mesa
      const newToken = uuidv4();
  
      // 4. Atualiza a mesa com o novo token
      const { error: updateError } = await supabase
        .from('tables')
        .update({ token: newToken })
        .eq('token', tableToken);
  
      if (updateError) throw updateError;
  
      // 5. Atualiza o estado local
      setTables(prevTables => 
        prevTables.map(table => 
          table.token === tableToken 
            ? { ...table, token: newToken } 
            : table
        )
      );
  
      toast({
        title: "Mesa finalizada com sucesso!",
        description: "Todos os pedidos foram removidos e a mesa foi reiniciada.",
      });
  
      // 6. Atualiza a lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error("Erro ao finalizar mesa:", error);
      toast({
        title: "Erro ao finalizar mesa",
        description: "Ocorreu um erro ao processar a finalização da mesa.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!restaurant?.id) return;
    
    // Definir corretamente a variável channel
    const channel = supabase.channel(`restaurant-orders-${restaurant.id}`);
    
    // Configuração do canal... (como acima)
    
    // Configurar polling
    const intervalId = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', restaurant.id);
          
        if (error) throw error;
        setOrders(data);
      } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
      }
    }, 10000);
    
    return () => {
      // Agora ambos channel e intervalId estão definidos corretamente
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [restaurant?.id]);

  const fetchOrders = async () => {
    try {
      // Verifica se o restaurante e o ID do restaurante estão definidos
      if (!restaurant?.id) {
        console.error("Restaurante não encontrado. Não foi possível buscar os pedidos.");
        return;
      }
  
      // Busca os pedidos no Supabase
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id); // Usa o ID do restaurante
  
      if (error) throw error;
  
      // Atualiza o estado com os pedidos
      setOrders(data || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Ocorreu um erro ao carregar os pedidos.",
        variant: "destructive",
      });
    }
  };
  
  // Busca os pedidos quando o restaurante é carregado
  useEffect(() => {
    if (restaurant?.id) {
      fetchOrders();
    }
  }, [restaurant]); // Dependência: restaurant

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status do pedido atualizado!",
        description: `O pedido foi marcado como ${status === 'completed' ? 'concluído' : 'pendente'}.`,
      });

      // Atualiza a lista de pedidos
      fetchOrders();
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Ocorreu um erro ao atualizar o status do pedido.",
        variant: "destructive",
      });
    }
  };

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
        .eq('restaurant_id', restaurantId)
        .order('order_itens');

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

  const handleDeleteCategory = (category: Category) => {
    setMenuItemToDelete(null);
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
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      });
    } finally {
      // Fecha o diálogo
      setDeleteDialogOpen(false);
      // Limpa a categoria a ser excluída
      setCategoryToDelete(null);
    }
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setMenuItemDialogOpen(true);
  };

  const handleDeleteMenuItem = (item: MenuItem) => {
    setCategoryToDelete(null);
    setMenuItemToDelete(item);
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
      toast({
        title: "Item excluído",
        description: "O item do cardápio foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o item do cardápio.",
        variant: "destructive",
      });
    } finally {
      // Fecha o diálogo
      setDeleteDialogOpen(false);
      // Limpa o item a ser excluído
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
        name: item.name,
        price: item.price,
        order_itens: index,
      }));

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

  const generateTableQRCode = (tableNumber: number) => {
    const id = uuidv4(); // Gera um ID único
    const token = uuidv4(); // Gera um token único
    const newTable = {
      id: id,
      tableNumber: tableNumber,
      token: token,
    };

    // Atualiza o estado local
    setTables((prevTables) => [...prevTables, newTable]);

    // Salva no banco de dados
    saveTableToDatabase(newTable);
  };

  const saveTableToDatabase = async (table: { id: string; tableNumber: number; token: string }) => {
    try {
      const restaurantId = restaurant?.id;

      if (!restaurantId) {
        console.error("Restaurante não encontrado. Não foi possível salvar a mesa.");
        return;
      }

      const { error } = await supabase
        .from('tables')
        .insert([
          {
            id: table.id,
            table_number: table.tableNumber,
            token: table.token,
            restaurant_id: restaurantId,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Mesa adicionada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar mesa:", error);
      toast({
        title: "Erro ao salvar mesa",
        description: "Ocorreu um erro ao adicionar a mesa.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 md:px-8">
        {/* Logo e Título "Painel Administrativo" */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            {restaurant?.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="Logo do Restaurante"
                className="w-12 h-12 object-contain rounded-md"
              />
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text text-center sm:text-left">
              Painel Administrativo
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="mt-3 sm:mt-0 w-full sm:w-auto"
            style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
          >
            Sair
          </Button>
        </div>
      {/* Navbar */}
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
  
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 md:px-8">
        {/* Seção de Produtos (Categorias e Itens do Cardápio) */}
        {activeSection === "produtos" && (
          <div className="grid gap-6 sm:gap-8">
            {/* Seção de Categorias */}
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
  
            {/* Seção de Itens do Cardápio */}
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
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.active
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
        )}
  
        {/* Seção de Mesas - QR Code */}
        {activeSection === "mesas" && (
          <Card className="bg-background shadow-sm mt-6">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-0">Mesas</h2>
              <Button
                onClick={() => {
                  const tableNumber = tables.length + 1;
                  generateTableQRCode(tableNumber);
                }}
                className="w-full sm:w-auto"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                Adicionar Mesa
              </Button>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div key={table.id} className="flex flex-col items-center">
                    <QRCodeSVG value={` https://a2de-45-234-137-54.ngrok-free.app/${restaurant?.slug || 'seu-restaurante'}/${table.token}`} size={200} />
                    <p className="mt-2 text-sm text-text">Mesa {table.tableNumber}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
  
        {/* Seção de Pedidos por Mesa */}
        {activeSection === "pedidos" && (
          <Card className="bg-background shadow-sm mt-6">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-text mb-3 sm:mb-0">Pedidos por Mesa</h2>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <TableOrders
                orders={orders}
                tables={tables}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onTableFinalized={handleFinalizeTable}
                restaurantId={restaurant?.id}
              />
            </CardContent>
          </Card>
        )}
  
        {/* Seção de Cardápio - QR Code */}
        {activeSection === "cardapio" && (
          <div className="mt-6">
            <Button
              onClick={() => setShowQRCode(!showQRCode)}
              className="w-full sm:w-auto bg-primary text-primary"
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
        )}
  
        {/* Dialogs e Alertas */}
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
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-white max-w-md mx-auto border-2 border-gray-300 shadow-xl rounded-lg">
            <AlertDialogHeader className="pb-3">
              <AlertDialogTitle className="text-red-600 text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Confirmar exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-800 mt-3 text-base">
                {categoryToDelete !== null
                  ? "Tem certeza que deseja excluir esta categoria? Esta ação removerá todos os itens associados."
                  : "Tem certeza que deseja excluir este item do cardápio?"}
                <p className="mt-2 font-medium text-red-600 text-base">Esta ação não pode ser desfeita.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-300 mt-4">
              <AlertDialogCancel
                className="bg-gray-100 text-gray-800 border border-gray-400 hover:bg-gray-200 transition-colors w-full sm:w-auto rounded-md font-medium text-base"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={categoryToDelete !== null ? confirmDeleteCategory : confirmDeleteMenuItem}
                className="bg-red-600 text-white hover:bg-red-700 transition-colors w-full sm:w-auto rounded-md flex items-center justify-center font-medium text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </div>
  );
};

export default Admin;