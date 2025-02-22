import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: number;
  onCategoryChange: (categoryId: number) => void;
  headerHeight: number;
}

export const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryChange,
  headerHeight,
}: CategoryNavProps) => {
  const [currentBanner, setCurrentBanner] = useState<string | undefined>(
    categories.find((cat) => cat.id === activeCategory)?.banner_url
  );

  useEffect(() => {
    const activeCat = categories.find((cat) => cat.id === activeCategory);
    if (activeCat?.banner_url) {
      setCurrentBanner(activeCat.banner_url);
    } else {
      setCurrentBanner(undefined);
    }
  }, [activeCategory, categories]);

  return (
    <div>
      {/* Banner estático */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {currentBanner && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-48 sm:h-64 md:h-80 overflow-hidden"
            >
              <img
                src={currentBanner}
                alt="Banner da categoria"
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navegação que acompanha o scroll */}
      <div className="relative">
        <div 
          className="fixed left-0 right-0 bg-white shadow-sm z-10" 
          style={{ top: `${headerHeight}px` }}
        >
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${
                    activeCategory === category.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};