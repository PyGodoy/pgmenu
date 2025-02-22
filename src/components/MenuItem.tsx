import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import type { MenuItem as MenuItemType } from "@/types";

interface MenuItemProps extends Omit<MenuItemType, 'id' | 'category_id' | 'created_at' | 'updated_at' | 'dietary_info'> {}

export const MenuItem = ({ name, description, price, image_url }: MenuItemProps) => {
  const [expanded, setExpanded] = useState(false); // Estado para controlar a expansão

  return (
    <Card className="group menu-item overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover" // Alterado para object-cover
          />
        </div>
        <div className="p-2 sm:p-4">
          <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
            <h3 className="font-display text-sm sm:text-lg font-medium">
              {name}
            </h3>
            <span className="font-medium text-primary whitespace-nowrap text-sm sm:text-base">
              R${price.toFixed(2)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
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