import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Restaurant } from "@/types";

interface HeaderProps {
  onSearch: (query: string) => void;
  onHeaderHeightChange: (height: number) => void;
  restaurant: Restaurant;
}

export const Header = ({ onSearch, onHeaderHeightChange, restaurant }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Atualiza a altura do Header quando ela mudar
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        onHeaderHeightChange(height);
      }
    };

    updateHeaderHeight(); // Atualiza na montagem inicial
    window.addEventListener("resize", updateHeaderHeight); // Atualiza no redimensionamento
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [onHeaderHeightChange]);

  // Detecta o scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo e nome do restaurante */}
          <div className="flex items-center gap-3">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={`Logo do ${restaurant.name}`}
                className="h-10 w-10 rounded-full object-cover border-2 border-primary"
              />
            )}
            <div className="text-left">
              <h1 className="font-display text-xl font-bold text-primary">
                {restaurant.name}
              </h1>
              <p className="text-xs text-muted-foreground">{restaurant.description}</p>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="relative flex-1 max-w-[180px]">
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8 pr-3 h-8 rounded-full border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              onChange={(e) => onSearch(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
};