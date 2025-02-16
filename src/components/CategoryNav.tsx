
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
      className="sticky top-[120px] md:top-[100px] bg-background/80 backdrop-blur-md z-40 -mx-2 md:mx-0"
    >
      <div className="flex gap-1 sm:gap-2 overflow-x-auto py-2 sm:py-4 px-2 sm:px-4 md:px-0 no-scrollbar">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "secondary"}
            className="whitespace-nowrap rounded-full text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 h-auto"
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
