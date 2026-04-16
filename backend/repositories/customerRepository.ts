import { getSupabase } from '../supabase.js';

export interface Customer {
  id?: number;
  vendor: string;
  product_group?: string;
  product_name?: string;
  product_id?: number | null;
  created_at?: string;
}

export class CustomerRepository {
  async getAll(): Promise<Customer[]> {
    try {
      const { data, error } = await getSupabase()
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') { // Table not found
          console.warn('Customers table not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('CustomerRepository.getAll Error:', err);
      throw err;
    }
  }

  async create(customer: Customer): Promise<number> {
    const { data, error } = await getSupabase()
      .from('customers')
      .insert([customer])
      .select();
    
    if (error) {
      console.error('Customer Create Error:', error);
      throw error;
    }
    if (!data || data.length === 0) throw new Error('No data returned after insert');
    return data[0].id;
  }

  async update(id: number, customer: Partial<Customer>): Promise<void> {
    const { error } = await getSupabase()
      .from('customers')
      .update(customer)
      .eq('id', id);
    
    if (error) throw error;
  }

  async delete(id: number): Promise<void> {
    const { error } = await getSupabase()
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
