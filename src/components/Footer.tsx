
export const Footer = () => {
  return (
    <footer className="bg-secondary mt-20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-medium mb-4">La Maison</h3>
            <p className="text-sm text-muted-foreground">
              Bringing the finest French cuisine to your table since 1995.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Gastronomy Street</li>
              <li>Paris, France</li>
              <li>+33 1 23 45 67 89</li>
              <li>contact@lamaison.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Monday - Friday: 11:30 - 23:00</li>
              <li>Saturday: 11:30 - 23:30</li>
              <li>Sunday: 11:30 - 22:00</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 La Maison. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
