import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, ImageIcon } from "lucide-react";
import type { Category } from "@/types";

// Esquema Zod atualizado para incluir o campo de imagem
const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  banner_url: z.string().optional(), // URL do banner
  banner_file: z.instanceof(File).optional(), // Arquivo de imagem
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  onSuccess: () => void;
}

export function CategoryDialog({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(category?.banner_url || "");
  const { toast } = useToast();
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      banner_url: category?.banner_url || "",
    },
  });

  useEffect(() => {
    if (open && category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        banner_url: category.banner_url || "",
      });
      setPreviewUrl(category.banner_url || "");
    } else if (!open) {
      form.reset({
        name: "",
        slug: "",
        banner_url: "",
      });
      setPreviewUrl("");
    }
  }, [open, category, form]);

  // Função para fazer upload da imagem
  const handleImageUpload = async (file: File) => {
    try {
      setUploadLoading(true);

      // Gerar um nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}${Date.now().toString()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Fazer upload do arquivo para o Supabase Storage
      const { data, error } = await supabase.storage
        .from("category-banners") // Nome do bucket no Supabase Storage
        .upload(filePath, file);

      if (error) throw error;

      // Obter a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from("category-banners")
        .getPublicUrl(filePath);

      // Atualizar o formulário com a nova URL
      form.setValue("banner_url", publicUrl);
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

  // Função para enviar o formulário
  const onSubmit = async (data: CategoryFormData) => {
    try {
      setLoading(true);

      // Obter o ID do restaurante associado ao usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user?.id)
        .single();

      if (restaurantError || !restaurant) {
        throw new Error("Restaurante não encontrado.");
      }

      const categoryData = {
        name: data.name,
        slug: data.slug,
        banner_url: data.banner_url,
        restaurant_id: restaurant.id,
        created_at: new Date().toISOString(),
      };

      if (isEditing && category) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", category.id);

        if (error) throw error;

        toast({
          title: "Categoria atualizada com sucesso!",
        });
      } else {
        // Criar nova categoria
        const { error } = await supabase.from("categories").insert([categoryData]);

        if (error) throw error;

        toast({
          title: "Categoria criada com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setPreviewUrl("");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar categoria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da categoria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="slug-da-categoria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner_file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner</FormLabel>
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
                        />
                        {uploadLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      </div>
                      {previewUrl && (
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={previewUrl}
                            alt="Preview do banner"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {!previewUrl && (
                        <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}