import { getSupabase } from '../supabase.js';
import { Sale } from '../models.js';

export class SalesRepository {
  async getAll(): Promise<Sale[]> {
    try {
      const { data, error } = await getSupabase()
        .from('sales')
        .select('*');
      if (error) {
        if (error.code === '42P01') {
          console.warn('Sales table not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data as Sale[];
    } catch (err) {
      console.error('SalesRepository.getAll Error:', err);
      throw err;
    }
  }

  async getById(id: number): Promise<Sale | null> {
    const { data, error } = await getSupabase()
      .from('sales')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Sale | null;
  }

  async create(sale: Sale): Promise<number> {
    const { data, error } = await getSupabase()
      .from('sales')
      .insert([sale])
      .select();
    if (error) {
      console.error('SalesRepository.create Error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Failed to create sale: No data returned');
    }
    return data[0].id;
  }

  async update(id: number, sale: Sale): Promise<void> {
    const { error } = await getSupabase()
      .from('sales')
      .update(sale)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: number): Promise<void> {
    const { error } = await getSupabase()
      .from('sales')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
