import type { Restaurant } from "@/types";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer className="bg-secondary mt-20 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 text-center">
          {/* Logo e Sobre o restaurante */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={itemVariants}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            {restaurant.logo_url && (
              <div className="mb-4">
                <img
                  src={restaurant.logo_url}
                  alt={`Logo do ${restaurant.name}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary"
                />
              </div>
            )}
            <h3 className="font-display text-lg font-semibold mb-3 text-primary">
              {restaurant.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
              {restaurant.description}
            </p>
            {restaurant.social_media && (
              <div className="flex justify-center space-x-3">
                {restaurant.social_media.facebook && (
                  <a
                    href={restaurant.social_media.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark transition-colors duration-300"
                  >
                    <FaFacebook size={18} />
                  </a>
                )}
                {restaurant.social_media.instagram && (
                  <a
                    href={restaurant.social_media.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark transition-colors duration-300"
                  >
                    <FaInstagram size={18} />
                  </a>
                )}
                {restaurant.social_media.twitter && (
                  <a
                    href={restaurant.social_media.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-dark transition-colors duration-300"
                  >
                    <FaTwitter size={18} />
                  </a>
                )}
              </div>
            )}
          </motion.div>

          {/* Contato */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={itemVariants}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <h4 className="font-semibold text-base mb-3 text-primary">Contato</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center justify-center gap-2">
                <span className="text-primary">📍</span>
                <span>{restaurant.address}</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="text-primary">📞</span>
                <span>{restaurant.phone}</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="text-primary">✉️</span>
                <span>{restaurant.email}</span>
              </li>
            </ul>
          </motion.div>

          {/* Horário de Funcionamento */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={itemVariants}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col items-center"
          >
            <h4 className="font-semibold text-base mb-3 text-primary">
              Horário de Funcionamento
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {restaurant.hours_of_operation.split("\n").map((hours, index) => (
                <li key={index} className="flex items-center justify-center gap-2">
                  <span className="text-primary">⏰</span>
                  <span>{hours}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Rodapé inferior */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={itemVariants}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 pt-6 border-t border-gray-700 text-center"
        >
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {restaurant.name}. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};