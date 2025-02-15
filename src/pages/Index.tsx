
import { useState } from "react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuItem } from "@/components/MenuItem";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";

// Sample data - this would come from your backend in production
const categories = [
  { id: "starters", name: "Starters" },
  { id: "mains", name: "Main Courses" },
  { id: "desserts", name: "Desserts" },
  { id: "wines", name: "Wines" },
  { id: "cocktails", name: "Cocktails" },
];

const menuItems = [
  {
    id: 1,
    name: "Soupe à l'Oignon",
    description: "Traditional French onion soup with melted Gruyère cheese and crusty bread",
    price: "€12",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=60",
    category: "starters",
  },
  {
    id: 2,
    name: "Coq au Vin",
    description: "Braised chicken in red wine sauce with mushrooms and pearl onions",
    price: "€28",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&auto=format&fit=crop&q=60",
    category: "mains",
  },
  {
    id: 3,
    name: "Crème Brûlée",
    description: "Classic vanilla custard with caramelized sugar crust",
    price: "€10",
    image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800&auto=format&fit=crop&q=60",
    category: "desserts",
  },
  // Add more items as needed
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === item.category;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && (searchQuery === "" || matchesSearch);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={setSearchQuery} />
      <main className="flex-1 pt-32">
        <div className="container mx-auto px-4">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredItems.map((item) => (
              <MenuItem key={item.id} {...item} />
            ))}
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
};

export default Index;
