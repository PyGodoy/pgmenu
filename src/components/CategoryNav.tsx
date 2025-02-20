import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Adicionado para animação
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

  // Atualiza o banner quando a categoria ativa muda
  useEffect(() => {
    const activeCat = categories.find((cat) => cat.id === activeCategory);
    if (activeCat?.banner_url) {
      setCurrentBanner(activeCat.banner_url);
    } else {
      setCurrentBanner(undefined); // Caso não haja banner
    }
  }, [activeCategory, categories]);

  return (
    <div className="sticky top-0 z-10" style={{ top: headerHeight }}>
      {/* Banner da categoria ativa */}
      <AnimatePresence mode="wait">
        {currentBanner && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-48 sm:h-64 md:h-80 overflow-hidden relative"
          >
            <img
              src={currentBanner}
              alt="Banner da categoria"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegação das categorias (mantendo o que já existe) */}
      <div className="flex overflow-x-auto bg-white shadow-sm">
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
  );
};