
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  dietary_info?: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
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
    twitter?: string;
  };
  created_at: string;
  updated_at: string;
}
