import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { MenuItem, Category } from "@/types";

const menuItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.string().min(1, "Preço é obrigatório").transform((val) => parseFloat(val)),
  category_id: z.string().min(1, "Categoria é obrigatória").transform((val) => parseInt(val)),
  image: z.instanceof(File).optional(),
  image_url: z.string().optional(), // Torna o campo image_url opcional
  active: z.boolean(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem;
  categories: Category[];
  onSuccess: () => void;
}

export function MenuItemDialog({ 
  open, 
  onOpenChange, 
  menuItem, 
  categories,
  onSuccess 
}: MenuItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(menuItem?.image_url || "");
  const { toast } = useToast();
  const isEditing = !!menuItem;

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price?.toString() || "", // Fixed this line
      category_id: menuItem?.category_id?.toString() || "",
      image_url: menuItem?.image_url || "",
      active: menuItem?.active || true, // Adicione esta linha
    },
  });

  useEffect(() => {
    if (open && menuItem) {
      // Atualiza os valores do formulário
      form.reset({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price?.toString() || "", // Garantir que o preço seja uma string
        category_id: menuItem.category_id?.toString() || "", // Garantir que o category_id seja uma string
        image_url: menuItem.image_url || "",
        active: menuItem.active, // Use o valor atual do item
      });
      // Atualiza a preview da imagem
      setPreviewUrl(menuItem.image_url || "");
    } else if (!open) {
      // Limpa o formulário quando fecha o modal
      form.reset({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        active: true, // Adicione esta linha
      });
      setPreviewUrl("");
    }
  }, [open, menuItem, form]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}${Date.now().toString()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('menu-items')
        .upload(filePath, file);

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-items')
        .getPublicUrl(filePath);

      // Update the form with the new image URL
      form.setValue('image_url', publicUrl);
      setPreviewUrl(publicUrl);

      toast({
        title: "Imagem carregada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    try {
      setLoading(true);
  
      // Obtenha o ID do restaurante associado ao usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user?.id)
        .single();
  
      if (restaurantError || !restaurant) {
        throw new Error('Restaurante não encontrado.');
      }
  
      const menuItemData = {
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        image_url: data.image_url || null, // Permite que image_url seja null
        restaurant_id: restaurant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: data.active,
      };
  
      if (isEditing && menuItem) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            image_url: data.image_url || null, // Permite que image_url seja null
            active: data.active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", menuItem.id);
  
        if (error) throw error;
  
        toast({
          title: "Item atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert([{
            name: data.name,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            image_url: data.image_url || null, // Permite que image_url seja null
            restaurant_id: restaurant.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            active: data.active,
          }]);
  
        if (error) throw error;
  
        toast({
          title: "Item criado com sucesso!",
        });
      }
  
      onSuccess();
      onOpenChange(false);
      form.reset();
      setPreviewUrl("");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: 'var(--background)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--primary)' }}>
            {isEditing ? "Editar Item" : "Novo Item"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: 'var(--text)' }}>Nome</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Nome do item" 
                      style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ color: 'var(--text)' }}>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descreva o item"
                      className="min-h-[100px]"
                      style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: 'var(--text)' }}>Preço</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        onChange={(e) => field.onChange(e.target.value)} // Garantir que o valor seja uma string
                        style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: 'var(--text)' }}>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
                        {categories.map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id.toString()}
                            style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4" style={{ borderColor: 'var(--secondary)' }}>
                  <FormLabel style={{ color: 'var(--text)' }}>Ativo</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className={clsx(
                        "data-[state=checked]:bg-green-500", // Cor verde quando ativo
                        "data-[state=unchecked]:bg-red-500" // Cor cinza quando inativo
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel style={{ color: 'var(--text)' }}>Imagem (Opcional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                          }}
                          className="flex-1"
                          style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}
                        />
                        {uploadLoading && (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
                        )}
                      </div>
                      {previewUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted" style={{ borderColor: 'var(--secondary)' }}>
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {!previewUrl && (
                        <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted" style={{ borderColor: 'var(--secondary)' }}>
                          <ImageIcon className="h-8 w-8 text-muted-foreground" style={{ color: 'var(--primary)' }} />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                style={{ backgroundColor: 'var(--background)', color: 'var(--text)', borderColor: 'var(--secondary)' }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
              >
                {loading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}