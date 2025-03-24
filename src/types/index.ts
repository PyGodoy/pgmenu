
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  promotional_price?: number;
  is_promotional?: boolean; 
  image_url: string;
  category_id: number;
  dietary_info?: string[];
  created_at: string;
  updated_at: string;
  active: boolean;
  order_itens?: number; // Adicione esta linha
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  banner_url?: string;
  order?: number;
  created_at?: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  address: string;
  phone: string;
  email: string;
  hours_of_operation: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  created_at: string;
  updated_at: string;
  customization?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    layout?: "grid" | "list";
  };
}

export type Table = {
  id: string; // Alterado de number para string
  table_number: number;
  token: string;
  restaurant_id: number;
  customer_name: string;
  created_at?: string;
  updated_at?: string;
};
