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
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
          <div className="text-center md:text-left">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground">{restaurant.description}</p>
          </div>
          <div className="relative w-full md:w-auto max-w-sm">
            <Input
              type="search"
              placeholder="Search menu..."
              className="pl-10 pr-4 h-10 rounded-full border-gray-200"
              onChange={(e) => onSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
};