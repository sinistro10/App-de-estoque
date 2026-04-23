import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Transaction, Product } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, ShoppingCart, History } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setTransactions(db.getTransactions());
    setProducts(db.getProducts());
  }, []);

  const getProductName = (id: string) => {
    return products.find(p => p.id === id)?.name || 'Produto excluído';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-800 rounded-xl text-white">
          <History size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Histórico de Movimentações</h2>
          <p className="text-slate-500 text-sm">Log completo de entradas, saídas e vendas</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <th className="px-6 py-4 border-b border-slate-100">Data</th>
              <th className="px-6 py-4 border-b border-slate-100">Tipo</th>
              <th className="px-6 py-4 border-b border-slate-100">Produto</th>
              <th className="px-6 py-4 border-b border-slate-100 text-center">Quant.</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Valor Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                  {formatDate(t.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {t.type === 'IN' && (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <ArrowUpRight size={12} /> Entrada
                      </span>
                    )}
                    {t.type === 'OUT' && (
                      <span className="flex items-center gap-1.5 text-rose-700 bg-rose-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <ArrowDownRight size={12} /> Saída
                      </span>
                    )}
                    {t.type === 'SALE' && (
                      <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        <ShoppingCart size={12} /> Venda
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{getProductName(t.productId)}</span>
                    {t.note && <span className="text-[10px] text-slate-400 font-medium">{t.note}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-bold text-slate-700">
                  {t.quantity}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={cn(
                    "font-bold",
                    t.type === 'IN' ? "text-slate-900" : "text-emerald-600"
                  )}>
                    {formatCurrency(t.totalValue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="p-12 text-center text-slate-500">Nenhuma movimentação registrada.</div>
        )}
      </div>
    </div>
  );
}
