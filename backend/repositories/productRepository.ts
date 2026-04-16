import { getSupabase } from '../supabase.js';
import { Product } from '../models.js';

export class ProductRepository {
  async getAll(): Promise<any[]> {
    try {
      const { data, error } = await getSupabase()
        .from('products')
        .select('*, suppliers(supplier_name)');
      
      if (error) {
        // Fallback if relationship doesn't exist yet
        console.warn('Product join with suppliers failed, falling back to simple select:', error.message);
        const { data: simpleData, error: simpleError } = await getSupabase()
          .from('products')
          .select('*');
        
        if (simpleError) throw simpleError;
        return simpleData || [];
      }
      
      return data || [];
    } catch (err) {
      console.error('ProductRepository.getAll Error:', err);
      throw err;
    }
  }

  async getLastSerialByGroup(group: string): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from('products')
      .select('serial_no')
      .eq('product_group', group)
      .order('id', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0].serial_no : null;
  }

  async getLastSerial(): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from('products')
      .select('serial_no')
      .order('id', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data && data.length > 0 ? data[0].serial_no : null;
  }

  async create(product: Product): Promise<number> {
    const { data, error } = await getSupabase()
      .from('products')
      .insert([product])
      .select();
    if (error) {
      console.error('ProductRepository.create Error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Failed to create product: No data returned');
    }
    return data[0].id;
  }

  async update(id: number, product: Product): Promise<void> {
    const { error } = await getSupabase()
      .from('products')
      .update(product)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: number): Promise<void> {
    const { error } = await getSupabase()
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
