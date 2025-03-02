export type Json = string | number | boolean | null;

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: number
          name: string
          description: string | null
          logo_url: string | null
          address: string
          phone: string
          email: string
          hours_of_operation: string
          social_media: Json | null
          created_at: string | null
          updated_at: string | null
          slug: string
          owner_id: string | null
          customization?: {
            primaryColor?: string;
            secondaryColor?: string;
            backgroundColor?: string;
            textColor?: string;
            layout?: "grid" | "list";
          };
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          logo_url?: string | null
          address: string
          phone: string
          email: string
          hours_of_operation: string
          social_media?: Json | null
          created_at?: string | null
          updated_at?: string | null
          slug: string
          user_id?: string | null
          customization?: {
            primaryColor?: string;
            secondaryColor?: string;
            backgroundColor?: string;
            textColor?: string;
            layout?: "grid" | "list";
          };
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          logo_url?: string | null
          address?: string
          phone?: string
          email?: string
          hours_of_operation?: string
          social_media?: Json | null
          created_at?: string | null
          updated_at?: string | null
          slug?: string
          user_id?: string | null
          customization?: {
            primaryColor?: string;
            secondaryColor?: string;
            backgroundColor?: string;
            textColor?: string;
            layout?: "grid" | "list";
          };
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          created_at: string | null
          restaurant_id: number | null
          order: number | null
        }
        Insert: {
          id?: number
          name: string
          slug: string
          created_at?: string | null
          restaurant_id?: number | null
          order?: number | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          created_at?: string | null
          restaurant_id?: number | null
          order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_items: {
        Row: {
          id: number
          name: string
          description: string | null
          price: number
          image_url: string | null
          category_id: number | null
          created_at: string | null
          updated_at: string | null
          dietary_info: string[] | null
          restaurant_id: number | null
          active: boolean;
          order_itens: number | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category_id?: number | null
          created_at?: string | null
          updated_at?: string | null
          dietary_info?: string[] | null
          restaurant_id?: number | null
          active?: boolean;
          order_itens: number | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category_id?: number | null
          created_at?: string | null
          updated_at?: string | null
          dietary_info?: string[] | null
          restaurant_id?: number | null
          active?: boolean;
          order_itens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          is_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row']

export type Enums<
  T extends keyof Database['public']['Enums']
> = Database['public']['Enums'][T]
