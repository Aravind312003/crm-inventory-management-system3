console.log('Server script starting...');
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { getSupabase } from './backend/supabase.js';

import supplierRouter from './backend/routers/supplierRouter.js';
import productRouter from './backend/routers/productRouter.js';
import stockRouter from './backend/routers/stockRouter.js';
import salesRouter from './backend/routers/salesRouter.js';
import customerRouter from './backend/routers/customerRouter.js';
import authRouter from './backend/routers/authRouter.js';

async function startServer() {
  console.log('startServer function called');
  console.log('Starting server...');
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  app.use('/api/suppliers', supplierRouter);
  app.use('/api/products', productRouter);
  app.use('/api/stock', stockRouter);
  app.use('/api/sales', salesRouter);
  app.use('/api/customers', customerRouter);
  app.use('/api/auth', authRouter);

  // Dashboard Stats API
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const supabase = getSupabase();
      
      const results = await Promise.allSettled([
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('stock').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('amount, total_price, created_at'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('stock').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const [
        suppliersRes,
        productsRes,
        stockRes,
        salesRes,
        recentSalesRes,
        recentStockRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { data: null, error: r.reason, count: 0 });

      if (suppliersRes.error) console.error('Dashboard Stats - Suppliers Error:', suppliersRes.error);
      if (productsRes.error) console.error('Dashboard Stats - Products Error:', productsRes.error);
      if (stockRes.error) console.error('Dashboard Stats - Stock Error:', stockRes.error);
      if (salesRes.error) console.error('Dashboard Stats - Sales Error:', salesRes.error);
      if (recentSalesRes.error) console.error('Dashboard Stats - Recent Sales Error:', recentSalesRes.error);
      if (recentStockRes.error) console.error('Dashboard Stats - Recent Stock Error:', recentStockRes.error);

      const salesData = (salesRes.data as any[]) || [];
      const totalRevenue = salesData.reduce((acc, curr) => acc + (curr.total_price || curr.amount || 0), 0) || 0;

      // Process sales history for chart
      const salesByDate: Record<string, number> = {};
      salesData.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + (sale.total_price || sale.amount || 0);
      });

      const salesHistory = Object.entries(salesByDate)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);

      // Combine and sort recent activity
      const recentActivity = [
        ...((recentSalesRes.data as any[]) || []).map(s => ({ ...s, type: 'sale' })),
        ...((recentStockRes.data as any[]) || []).map(s => ({ ...s, type: 'stock' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);

      res.json({
        totalSuppliers: suppliersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalStockEntries: stockRes.count || 0,
        totalRevenue,
        salesHistory,
        recentActivity
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Creating Vite server...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      console.log('Vite server created.');
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('Failed to create Vite server:', viteErr);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER_STARTED_ON_PORT_${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server failed to start:', err);
  });
}

startServer();
