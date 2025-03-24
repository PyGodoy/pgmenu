import { Button } from "@/components/ui/button";

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Navbar = ({ activeSection, setActiveSection }: NavbarProps) => {
  return (
    <nav className="bg-background shadow-sm p-4 mb-6">
      <div className="container mx-auto flex flex-col sm:flex-row gap-4 justify-center">
        <Button
            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            variant={activeSection === "produtos" ? "default" : "outline"}
            onClick={() => setActiveSection("produtos")}
        >
          Produtos
        </Button>
        <Button
            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            variant={activeSection === "mesas" ? "default" : "outline"}
            onClick={() => setActiveSection("mesas")}
        >
          Mesas - QR Code
        </Button>
        <Button
            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            variant={activeSection === "pedidos" ? "default" : "outline"}
            onClick={() => setActiveSection("pedidos")}
        >
          Pedidos por Mesa
        </Button>
        <Button
            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
          variant={activeSection === "cardapio" ? "default" : "outline"}
          onClick={() => setActiveSection("cardapio")}
        >
          Cardápio - QR Code
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;