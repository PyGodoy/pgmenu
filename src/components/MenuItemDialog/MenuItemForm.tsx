
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useState, useEffect } from "react";
import { ImageUploader } from "./ImageUploader";
import type { MenuItem, Category } from "@/types";

const menuItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.coerce.number().min(0, "Preço deve ser maior que zero"),
  category_id: z.coerce.number().int().positive("Categoria é obrigatória"),
  image: z.instanceof(File).optional(),
  image_url: z.string().optional(),
  active: z.boolean(),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  onSubmit: (data: MenuItemFormData) => Promise<void>;
  menuItem?: MenuItem;
  categories: Category[];
  isLoading: boolean;
  onCancel: () => void;
}

export function MenuItemForm({ 
  onSubmit, 
  menuItem, 
  categories, 
  isLoading,
  onCancel 
}: MenuItemFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(menuItem?.image_url || "");
  const isEditing = !!menuItem;

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      category_id: menuItem?.category_id || 0,
      image_url: menuItem?.image_url || "",
      active: menuItem?.active || true,
    },
  });

  useEffect(() => {
    if (menuItem) {
      // Atualiza os valores do formulário
      form.reset({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        category_id: menuItem.category_id,
        image_url: menuItem.image_url || "",
        active: menuItem.active,
      });
      // Atualiza a preview da imagem
      setPreviewUrl(menuItem.image_url || "");
    }
  }, [menuItem, form]);

  const handleFormSubmit = async (data: MenuItemFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do item" />
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Descreva o item"
                  className="min-h-[100px]"
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
                <FormLabel>Preço</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00" 
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
                <FormLabel>Categoria</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  defaultValue={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id.toString()}
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <FormLabel>Ativo</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className={clsx(
                    "data-[state=checked]:bg-green-500",
                    "data-[state=unchecked]:bg-red-500"
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
            <ImageUploader 
              previewUrl={previewUrl} 
              setPreviewUrl={setPreviewUrl} 
              setValue={form.setValue}
            />
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
