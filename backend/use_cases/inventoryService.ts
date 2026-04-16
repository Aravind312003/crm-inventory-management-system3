import { StockRepository } from '../repositories/stockRepository.js';
import { SalesRepository } from '../repositories/salesRepository.js';
import { Sale, Stock } from '../models.js';

export class InventoryService {
  private stockRepo = new StockRepository();
  private salesRepo = new SalesRepository();

  async createSaleOrder(sale: Sale, stockId: number): Promise<number> {
    // 1. Get all stock entries for this product to implement FIFO
    const allStocks = await this.stockRepo.getAll();
    const productStocks = allStocks
      .filter(s => s.product_name === sale.product_name)
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());

    if (productStocks.length === 0) {
      throw new Error(`No stock found for product: ${sale.product_name}`);
    }

    // 2. Use the selected stockId for initial price/volume calculations if needed, 
    // but we will reduce across all batches.
    const referenceStock = productStocks.find(s => s.id === stockId) || productStocks[0];

    // 3. Calculate unit price robustly
    let unitPrice = referenceStock.price_per_litre;
    if (!unitPrice || unitPrice === 0) {
      const divisor = referenceStock.volume > 0 ? referenceStock.volume : (referenceStock.stock_quantity > 0 ? referenceStock.stock_quantity : 1);
      unitPrice = referenceStock.total_price / divisor;
    }

    // 4. Calculate amount and volume: unitPrice * quantity
    const amount = unitPrice * sale.quantity;
    const volumeSold = (sale.volume !== undefined && sale.volume !== null && sale.volume !== 0) 
      ? sale.volume 
      : (referenceStock.volume > 0 ? (referenceStock.stock_quantity / referenceStock.volume) * sale.quantity : 0);
    
    const updatedSale = { 
      ...sale, 
      amount, 
      volume: volumeSold,
      product_id: referenceStock.product_id,
      other_price: sale.other_price || 0,
      total_price: sale.total_price || (amount + (sale.other_price || 0))
    };

    // 5. Create the sale order
    const saleId = await this.salesRepo.create(updatedSale);

    // 6. FIFO Reduction: Start from older stock and continue to latest
    let remainingQtyToReduce = sale.quantity; // units
    let remainingVolToReduce = volumeSold;    // litres

    for (const stockItem of productStocks) {
      if (remainingQtyToReduce <= 0 && remainingVolToReduce <= 0) break;

      // stockItem.volume is Stock Quantity (units)
      // stockItem.stock_quantity is Volume (L)
      const deductQty = Math.min(stockItem.volume, remainingQtyToReduce);
      const deductVol = Math.min(stockItem.stock_quantity, remainingVolToReduce);

      const newStockQty = stockItem.volume - deductQty;
      const newStockVol = stockItem.stock_quantity - deductVol;

      await this.stockRepo.updateStock(stockItem.id!, newStockVol, newStockQty);

      remainingQtyToReduce -= deductQty;
      remainingVolToReduce -= deductVol;
    }

    // 7. If there's still remaining (oversold), deduct from the latest batch
    if (remainingQtyToReduce > 0 || remainingVolToReduce > 0) {
      const latestStock = productStocks[productStocks.length - 1];
      const currentLatest = await this.stockRepo.getById(latestStock.id!);
      if (currentLatest) {
        await this.stockRepo.updateStock(
          latestStock.id!,
          currentLatest.stock_quantity - remainingVolToReduce,
          currentLatest.volume - remainingQtyToReduce
        );
      }
    }

    return saleId;
  }

  async deleteSaleOrder(saleId: number): Promise<void> {
    // 1. Get the sale order
    const sale = await this.salesRepo.getById(saleId);
    if (!sale) return;

    // 2. Find the corresponding stock entries to restore
    const allStocks = await this.stockRepo.getAll();
    const productStocks = allStocks
      .filter(s => s.product_name === sale.product_name)
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime()); // Oldest first

    if (productStocks.length > 0) {
      // Restore to the oldest batch first to counteract FIFO reduction
      const oldestStock = productStocks[0];
      const newStockVolume = oldestStock.stock_quantity + (sale.volume || 0);
      const newStockQuantity = oldestStock.volume + sale.quantity;
      await this.stockRepo.updateStock(oldestStock.id!, newStockVolume, newStockQuantity);
    }

    // 4. Delete the sale
    await this.salesRepo.delete(saleId);
  }

  async updateSaleOrder(saleId: number, newSaleData: Sale, stockId?: number): Promise<void> {
    // 1. Get old sale
    const oldSale = await this.salesRepo.getById(saleId);
    if (!oldSale) throw new Error('Sale not found');

    // 2. Restore old stock (FIFO restoration)
    const allStocks = await this.stockRepo.getAll();
    const productStocks = allStocks
      .filter(s => s.product_name === oldSale.product_name)
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
    
    if (productStocks.length > 0) {
      const oldestStock = productStocks[0];
      await this.stockRepo.updateStock(
        oldestStock.id!, 
        oldestStock.stock_quantity + (oldSale.volume || 0),
        oldestStock.volume + oldSale.quantity
      );
    }

    // 3. Re-fetch stocks for new reduction
    const updatedStocks = await this.stockRepo.getAll();
    const newProductStocks = updatedStocks
      .filter(s => s.product_name === newSaleData.product_name)
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());

    if (newProductStocks.length === 0) throw new Error('No stock found for product');

    const referenceStock = newProductStocks.find(s => s.id === stockId) || newProductStocks[0];

    // Calculate new volume if not provided
    const volumeSold = (newSaleData.volume !== undefined && newSaleData.volume !== null && newSaleData.volume !== 0)
      ? newSaleData.volume
      : (referenceStock.volume > 0 ? (referenceStock.stock_quantity / referenceStock.volume) * newSaleData.quantity : 0);

    // Update sale record
    await this.salesRepo.update(saleId, {
      ...newSaleData,
      volume: volumeSold,
      product_id: referenceStock.product_id
    });

    // 4. FIFO Reduction for the updated values
    let remainingQty = newSaleData.quantity;
    let remainingVol = volumeSold;

    for (const stockItem of newProductStocks) {
      if (remainingQty <= 0 && remainingVol <= 0) break;

      const deductQty = Math.min(stockItem.volume, remainingQty);
      const deductVol = Math.min(stockItem.stock_quantity, remainingVol);

      await this.stockRepo.updateStock(
        stockItem.id!,
        stockItem.stock_quantity - deductVol,
        stockItem.volume - deductQty
      );

      remainingQty -= deductQty;
      remainingVol -= deductVol;
    }

    // Handle oversold
    if (remainingQty > 0 || remainingVol > 0) {
      const latest = newProductStocks[newProductStocks.length - 1];
      const current = await this.stockRepo.getById(latest.id!);
      if (current) {
        await this.stockRepo.updateStock(latest.id!, current.stock_quantity - remainingVol, current.volume - remainingQty);
      }
    }
  }
}
