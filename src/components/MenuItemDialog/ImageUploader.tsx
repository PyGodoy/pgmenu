
import { useState } from "react";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploaderProps {
  previewUrl: string;
  setPreviewUrl: (url: string) => void;
  setValue: (name: string, value: string) => void;
}

export function ImageUploader({ previewUrl, setPreviewUrl, setValue }: ImageUploaderProps) {
  const [uploadLoading, setUploadLoading] = useState(false);
  const { toast } = useToast();

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
      setValue('image_url', publicUrl);
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

  return (
    <FormItem>
      <FormLabel>Imagem (Opcional)</FormLabel>
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
            {uploadLoading && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </div>
          {previewUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="Preview"
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
  );
}
