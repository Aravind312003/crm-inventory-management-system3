import { getSupabase } from '../supabase.js';
import { Stock } from '../models.js';

export class StockRepository {
  async getAll(): Promise<Stock[]> {
    try {
      const { data, error } = await getSupabase()
        .from('stock')
        .select('*');
      if (error) {
        if (error.code === '42P01') {
          console.warn('Stock table not found, returning empty array');
          return [];
        }
        throw error;
      }
      return data as Stock[];
    } catch (err) {
      console.error('StockRepository.getAll Error:', err);
      throw err;
    }
  }

  async getById(id: number): Promise<Stock | null> {
    const { data, error } = await getSupabase()
      .from('stock')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Stock | null;
  }

  async getLastSerial(): Promise<string | null> {
    const { data: pData, error: pError } = await getSupabase()
      .from('products')
      .select('serial_no')
      .order('serial_no', { ascending: false })
      .limit(1);
    
    const { data: sData, error: sError } = await getSupabase()
      .from('stock')
      .select('serial_no')
      .order('serial_no', { ascending: false })
      .limit(1);

    if (pError) throw pError;
    if (sError) throw sError;

    const pSerial = pData && pData.length > 0 ? pData[0].serial_no : null;
    const sSerial = sData && sData.length > 0 ? sData[0].serial_no : null;

    if (!pSerial && !sSerial) return null;
    if (!pSerial) return sSerial;
    if (!sSerial) return pSerial;

    return pSerial > sSerial ? pSerial : sSerial;
  }

  async create(stock: Stock): Promise<number> {
    const { data, error } = await getSupabase()
      .from('stock')
      .insert([stock])
      .select();
    if (error) {
      console.error('StockRepository.create Error:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Failed to create stock: No data returned');
    }
    return data[0].id;
  }

  async update(id: number, stock: Stock): Promise<void> {
    const { error } = await getSupabase()
      .from('stock')
      .update(stock)
      .eq('id', id);
    if (error) throw error;
  }

  async updateQuantity(id: number, newQuantity: number): Promise<void> {
    const { error } = await getSupabase()
      .from('stock')
      .update({ stock_quantity: newQuantity })
      .eq('id', id);
    if (error) throw error;
  }

  async updateStock(id: number, newQuantity: number, newVolume: number): Promise<void> {
    const { error } = await getSupabase()
      .from('stock')
      .update({ 
        stock_quantity: newQuantity,
        volume: newVolume
      })
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: number): Promise<void> {
    const { error } = await getSupabase()
      .from('stock')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
