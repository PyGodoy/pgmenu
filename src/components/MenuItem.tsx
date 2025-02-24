import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import type { MenuItem as MenuItemType } from "@/types";

interface MenuItemProps extends Omit<MenuItemType, 'id' | 'category_id' | 'created_at' | 'updated_at' | 'dietary_info'> {}

export const MenuItem = ({ name, description, price, image_url }: MenuItemProps) => {
  const [expanded, setExpanded] = useState(false); // Estado para controlar a expansão

  // Verifica se o item tem uma imagem
  const hasImage = !!image_url;

  return (
    <Card className="group menu-item overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Espaço da imagem ou fundo neutro */}
        <div className="aspect-[4/3] overflow-hidden relative">
          {hasImage ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <h3 className="text-xl font-display font-semibold text-gray-600 text-center px-4">
                {name}
              </h3>
            </div>
          )}
        </div>

        {/* Conteúdo textual */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            {/* Mostra o nome ao lado do preço SEMPRE (com ou sem imagem) */}
            <h3 className="font-display text-lg font-medium">
              {name}
            </h3>
            <span className="font-medium text-primary whitespace-nowrap">
              R${price.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {expanded ? description : `${description.length > 100 ? description.slice(0, 100) + '...' : description}`}
            {description.length > 100 && ( // Mostra o botão apenas se a descrição for longa
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline ml-1"
              >
                {expanded ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};