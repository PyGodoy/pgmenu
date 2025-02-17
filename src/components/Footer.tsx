import type { Restaurant } from "@/types";

interface FooterProps {
  restaurant: Restaurant;
}

export const Footer = ({ restaurant }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-secondary mt-20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-medium mb-4">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">
              {restaurant.description}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{restaurant.address}</li>
              <li>{restaurant.phone}</li>
              <li>{restaurant.email}</li>
              {restaurant.social_media && Object.entries(restaurant.social_media).map(([platform, url]) => (
                url && (
                  <li key={platform}>
                    <a 
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {restaurant.hours_of_operation.split('\n').map((hours, index) => (
                <li key={index}>{hours}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {restaurant.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};