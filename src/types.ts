/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'IN' | 'OUT' | 'SALE';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  category: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  price: number; // Cost price for IN, Selling price for OUT/SALE
  totalValue: number;
  date: string;
  note?: string;
}

export interface Sale {
  id: string;
  productId: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  profit: number;
  totalSale: number;
  date: string;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValueCost: number;
  totalValueSale: number;
  expectedProfit: number;
}
