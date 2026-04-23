import { Product, Transaction, Sale, InventoryStats } from '../types';

const STORAGE_KEY_PRODUCTS = 'estoque_master_products';
const STORAGE_KEY_TRANSACTIONS = 'estoque_master_transactions';
const STORAGE_KEY_SALES = 'estoque_master_sales';

// Initial dummy data if storage is empty
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Teclado Mecânico RGB',
    sku: 'TEC-001',
    description: 'Teclado mecânico com switches azuis e iluminação RGB.',
    costPrice: 150.0,
    sellingPrice: 299.9,
    currentStock: 10,
    minStock: 5,
    category: 'Periféricos',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mouse Gamer 12000 DPI',
    sku: 'MOU-002',
    description: 'Mouse óptico para jogos com alta precisão.',
    costPrice: 80.0,
    sellingPrice: 189.0,
    currentStock: 15,
    minStock: 10,
    category: 'Periféricos',
    createdAt: new Date().toISOString(),
  },
];

export const db = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  },

  getSales: (): Sale[] => {
    const data = localStorage.getItem(STORAGE_KEY_SALES);
    return data ? JSON.parse(data) : [];
  },

  saveSales: (sales: Sale[]) => {
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(sales));
  },

  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => {
    const products = db.getProducts();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    db.saveProducts([...products, newProduct]);
    return newProduct;
  },

  updateProduct: (product: Product) => {
    const products = db.getProducts();
    db.saveProducts(products.map((p) => (p.id === product.id ? product : p)));
  },

  deleteProduct: (id: string) => {
    const products = db.getProducts();
    db.saveProducts(products.filter((p) => p.id !== id));
  },

  registerTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const products = db.getProducts();
    const transactions = db.getTransactions();
    
    const productIndex = products.findIndex((p) => p.id === transaction.productId);
    if (productIndex === -1) throw new Error('Produto não encontrado');

    const product = products[productIndex];
    if (transaction.type === 'IN') {
      product.currentStock += transaction.quantity;
    } else {
      if (product.currentStock < transaction.quantity) {
        throw new Error('Estoque insuficiente');
      }
      product.currentStock -= transaction.quantity;
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    db.saveProducts([...products]);
    db.saveTransactions([newTransaction, ...transactions]);
    return newTransaction;
  },

  registerSale: (saleData: { productId: string; quantity: number; note?: string }) => {
    const products = db.getProducts();
    const product = products.find((p) => p.id === saleData.productId);
    
    if (!product) throw new Error('Produto não encontrado');
    if (product.currentStock < saleData.quantity) throw new Error('Estoque insuficiente');

    // Register Transaction
    const transaction = db.registerTransaction({
      productId: saleData.productId,
      type: 'SALE',
      quantity: saleData.quantity,
      price: product.sellingPrice,
      totalValue: product.sellingPrice * saleData.quantity,
      note: saleData.note || 'Venda realizada',
    });

    // Register Sale
    const sales = db.getSales();
    const newSale: Sale = {
      id: crypto.randomUUID(),
      productId: saleData.productId,
      quantity: saleData.quantity,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      totalSale: product.sellingPrice * saleData.quantity,
      profit: (product.sellingPrice - product.costPrice) * saleData.quantity,
      date: new Date().toISOString(),
    };

    db.saveSales([newSale, ...sales]);
    return { transaction, sale: newSale };
  },

  getStats: (): InventoryStats => {
    const products = db.getProducts();
    const sales = db.getSales();
    
    return {
      totalItems: products.reduce((acc, p) => acc + p.currentStock, 0),
      lowStockItems: products.filter((p) => p.currentStock <= p.minStock).length,
      totalValueCost: products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0),
      totalValueSale: products.reduce((acc, p) => acc + (p.currentStock * p.sellingPrice), 0),
      expectedProfit: products.reduce((acc, p) => acc + (p.currentStock * (p.sellingPrice - p.costPrice)), 0),
    };
  },

  getLowStockProducts: () => {
    return db.getProducts().filter((p) => p.currentStock <= p.minStock);
  },

  getPerformanceData: () => {
    const sales = db.getSales();
    // Group by date
    const performance = sales.reduce((acc: any, sale) => {
      const date = sale.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, profit: 0, revenue: 0 };
      }
      acc[date].profit += sale.profit;
      acc[date].revenue += sale.totalSale;
      return acc;
    }, {});

    return Object.values(performance).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
};
