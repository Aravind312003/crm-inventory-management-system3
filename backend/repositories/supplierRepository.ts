import { getSupabase } from '../supabase.js';
import { Supplier } from '../models.js';

export class SupplierRepository {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await getSupabase()
      .from('suppliers')
      .select('*');
    if (error) throw error;
    return data as Supplier[];
  }

  async create(supplier: Supplier): Promise<number> {
    const { data, error } = await getSupabase()
      .from('suppliers')
      .insert([supplier])
      .select();
    if (error) {
      console.error('SupplierRepository.create Error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Failed to create supplier: No data returned');
    }
    return data[0].id;
  }

  async update(id: number, supplier: Supplier): Promise<void> {
    const { error } = await getSupabase()
      .from('suppliers')
      .update(supplier)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: number): Promise<void> {
    const { error } = await getSupabase()
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
