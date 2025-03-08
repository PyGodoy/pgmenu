import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import type { MenuItem as MenuItemType } from "@/types";
import clsx from "clsx";

interface MenuItemProps extends Omit<MenuItemType, 'id' | 'category_id' | 'created_at' | 'updated_at' | 'dietary_info'> {
  is_promotional?: boolean;
  promotional_price?: number;
}

export const MenuItem = ({ name, description, price, image_url, is_promotional, promotional_price }: MenuItemProps) => {
  const [expanded, setExpanded] = useState(false); // Estado para controlar a expansão

  // Verifica se o item tem uma imagem
  const hasImage = !!image_url;

  return (
    <Card 
      className="group menu-item overflow-hidden hover:shadow-lg transition-shadow duration-300"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }} // Aplica as cores personalizadas
    >
      <CardContent className="p-0">
        {/* Renderiza o espaço da imagem apenas se houver uma imagem */}
        {hasImage && (
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Conteúdo textual */}
        <div className={`p-4 ${!hasImage ? "pt-6" : ""}`}>
          {/* Nome */}
          <h3 
            className="font-display text-lg font-medium mb-1"
            style={{ color: 'var(--primary)' }} // Aplica a cor primária
          >
            {name}
          </h3>

          {/* Preço */}
          <div className="font-medium whitespace-nowrap" style={{ color: 'var(--secondary)' }}>
            {is_promotional && promotional_price ? (
              <div className="flex items-center gap-2">
                <span className="line-through text-sm text-gray-500">R${price.toFixed(2)}</span>
                <span className="text-lg font-semibold">R${promotional_price.toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-lg font-semibold">R${price.toFixed(2)}</span>
            )}
          </div>

          {/* Descrição */}
          <p className="text-sm text-muted-foreground mt-2">
            {expanded ? description : `${description.length > 100 ? description.slice(0, 100) + '...' : description}`}
            {description.length > 100 && ( // Mostra o botão apenas se a descrição for longa
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline ml-1"
                style={{ color: 'var(--primary)' }} // Aplica a cor primária
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