
import { Card, CardContent } from "./ui/card";
import type { MenuItem as MenuItemType } from "@/types";

interface MenuItemProps extends Omit<MenuItemType, 'id' | 'category_id' | 'created_at' | 'updated_at' | 'dietary_info'> {}

export const MenuItem = ({ name, description, price, image_url }: MenuItemProps) => {
  return (
    <Card className="group menu-item overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={image_url}
            alt={name}
            className="menu-item-image w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-display text-lg font-medium line-clamp-2">{name}</h3>
            <span className="font-medium text-primary whitespace-nowrap">
              ${price.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
