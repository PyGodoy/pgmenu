import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import type { MenuItem as MenuItemType } from "@/types";
import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react"; // Importe o ícone de carrinho

interface MenuItemProps extends Omit<MenuItemType, 'id' | 'category_id' | 'created_at' | 'updated_at' | 'dietary_info'> {
  is_promotional?: boolean;
  promotional_price?: number;
  onAddToCart?: () => void;
  showAddButton?: boolean;
}

export const MenuItem = ({ name, description, price, image_url, is_promotional, promotional_price, onAddToCart, showAddButton }: MenuItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const hasImage = !!image_url;

  return (
    <Card 
      className="group menu-item overflow-hidden hover:shadow-lg transition-shadow duration-300"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <CardContent className="p-0">
        {hasImage && (
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`p-4 ${!hasImage ? "pt-6" : ""}`}>
          <h3 
            className="font-display text-lg font-medium mb-1"
            style={{ color: 'var(--primary)' }}
          >
            {name}
          </h3>
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
          <p className="text-sm text-muted-foreground mt-2">
            {expanded ? description : `${description.length > 100 ? description.slice(0, 100) + '...' : description}`}
            {description.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline ml-1"
                style={{ color: 'var(--primary)' }}
              >
                {expanded ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </p>
          {showAddButton && (
            <Button
              className="w-full mt-4 flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--text)' 
              }}
              onClick={onAddToCart}
            >
              <ShoppingCart className="w-5 h-5" /> {/* Ícone de carrinho */}
              Adicionar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};