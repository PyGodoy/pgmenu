
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MenuItemForm, type MenuItemFormData } from "./MenuItemForm";
import { createMenuItem, updateMenuItem } from "./menuItemService";
import type { MenuItem, Category } from "@/types";

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
  const { toast } = useToast();
  const isEditing = !!menuItem;

  const handleSubmit = async (data: MenuItemFormData) => {
    try {
      setLoading(true);
  
      if (isEditing && menuItem) {
        await updateMenuItem(menuItem.id, data);
        toast({
          title: "Item atualizado com sucesso!",
        });
      } else {
        await createMenuItem(data);
        toast({
          title: "Item criado com sucesso!",
        });
      }
  
      onSuccess();
      onOpenChange(false);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Item" : "Novo Item"}
          </DialogTitle>
        </DialogHeader>

        <MenuItemForm
          onSubmit={handleSubmit}
          menuItem={menuItem}
          categories={categories}
          isLoading={loading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
