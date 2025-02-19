import type { Restaurant } from "@/types";
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

interface FooterProps {
  restaurant: Restaurant;
}

export const Footer = ({ restaurant }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  const socialIcons: Record<string, JSX.Element> = {
    facebook: <FaFacebook />,
    instagram: <FaInstagram />,
    twitter: <FaTwitter />,
  };

  return (
    <footer className="bg-secondary mt-20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-lg font-medium mb-4">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {restaurant.description}
            </p>
            {restaurant.social_media && (
              <div className="flex space-x-4">
                {restaurant.social_media.facebook && (
                  <a href={restaurant.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                    <FaFacebook size={20} />
                  </a>
                )}
                {restaurant.social_media.instagram && (
                  <a href={restaurant.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                    <FaInstagram size={20} />
                  </a>
                )}
                {restaurant.social_media.twitter && (
                  <a href={restaurant.social_media.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                    <FaTwitter size={20} />
                  </a>
                )}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{restaurant.address}</li>
              <li>{restaurant.phone}</li>
              <li>{restaurant.email}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Horário de Funcionamento</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {restaurant.hours_of_operation.split('\n').map((hours, index) => (
                <li key={index}>{hours}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {restaurant.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
