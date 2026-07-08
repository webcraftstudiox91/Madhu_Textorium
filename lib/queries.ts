import { createClient } from '@/lib/supabase/client';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface DbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  is_top_seller: boolean;
  image?: string;
  image_fav?: string;
  sketch_image?: string;
  description?: string;
  colors?: string[];
  fabrics?: string[];
  features?: string[];
}

export interface DbFabricSwatch {
  id: string;
  product_id: string;
  name: string;
  image: string;
}

export interface DbOrderInput {
  customer_name: string;
  customer_phone: string;
  garment_type: string;
  fabric_preference: string;
  color_preference: string;
  style_preferences: Record<string, string>;
  measurements: Record<string, string>;
  photo_front_url?: string;
  photo_back_url?: string;
  photo_side_url?: string;
  special_instructions: string;
}

// ─── QUERY HELPERS (Client-safe database queries) ──────────────────────────

/**
 * Fetch all active products.
 */
export async function getProducts(): Promise<DbProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProducts failed:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch a single product by its database ID, including its associated fabric swatches (clothes).
 */
export async function getProductWithSwatches(productId: string): Promise<{ product: DbProduct; swatches: DbFabricSwatch[] } | null> {
  const supabase = createClient();
  
  const { data: product, error: pError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (pError || !product) {
    console.error('getProductById failed:', pError);
    return null;
  }

  const { data: swatches, error: sError } = await supabase
    .from('fabric_swatches')
    .select('*')
    .eq('product_id', productId)
    .eq('is_visible', true)
    .order('created_at', { ascending: true });

  if (sError) {
    console.error('getFabricSwatches failed:', sError);
  }

  return {
    product,
    swatches: swatches || [],
  };
}

/**
 * Fetch all fabric swatches for a given product category (e.g. Shirts, Suits)
 */
export async function getFabricSwatchesByCategory(category: string): Promise<DbFabricSwatch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('fabric_swatches')
    .select('*, products!inner(category)')
    .eq('products.category', category)
    .eq('is_visible', true);

  if (error) {
    console.error('getFabricSwatchesByCategory failed:', error);
    return [];
  }
  return data || [];
}

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

/**
 * Insert a customer's custom order into Supabase.
 * Executed browser-side when submitting the custom tailoring wizard.
 */
export async function createOrder(order: DbOrderInput) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        garment_type: order.garment_type,
        fabric_preference: order.fabric_preference,
        color_preference: order.color_preference,
        style_preferences: order.style_preferences,
        measurements: order.measurements,
        photo_front_url: order.photo_front_url,
        photo_back_url: order.photo_back_url,
        photo_side_url: order.photo_side_url,
        special_instructions: order.special_instructions,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('createOrder failed:', error);
    throw new Error(error.message);
  }
  return data;
}
