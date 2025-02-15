
import { useRef } from "react";
import { Button } from "./ui/button";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: number;
  onCategoryChange: (categoryId: number) => void;
}

export const CategoryNav = ({ categories, activeCategory, onCategoryChange }: CategoryNavProps) => {
  const navRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={navRef}
      className="flex gap-2 overflow-x-auto py-4 px-4 md:px-0 no-scrollbar"
    >
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? "default" : "secondary"}
          className="whitespace-nowrap rounded-full"
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};
