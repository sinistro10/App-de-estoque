import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Product } from '../types';
import { ShoppingBag, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setProducts(db.getProducts().filter(p => p.currentStock > 0));
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedProduct) return;

    try {
      db.registerSale({ productId: selectedProductId, quantity, note });
      setSuccess(true);
      setSelectedProductId('');
      setQuantity(1);
      setNote('');
      setProducts(db.getProducts().filter(p => p.currentStock > 0));
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
          <ShoppingBag size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nova Venda</h2>
          <p className="text-slate-500 text-sm">Gere vendas e atualize o estoque automaticamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSale} className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Selecionar Produto</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  <option value="">Escolha um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currentStock} em estoque)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    max={selectedProduct?.currentStock}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor Unitário</label>
                  <div className="w-full px-4 py-2 border border-slate-100 rounded-lg bg-slate-50 text-slate-500">
                    {selectedProduct ? formatCurrency(selectedProduct.sellingPrice) : 'R$ 0,00'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ex: Venda para cliente X..."
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!selectedProduct}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              Finalizar Venda
              <ArrowRight size={20} />
            </button>
          </form>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800"
              >
                <CheckCircle2 size={24} className="text-emerald-500" />
                <span className="font-medium">Venda realizada com sucesso! Estoque e lucro atualizados.</span>
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800"
              >
                <AlertCircle size={24} className="text-rose-500" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-6">Resumo da Venda</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-lg font-medium">
                  {selectedProduct ? formatCurrency(selectedProduct.sellingPrice * quantity) : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-semibold">
                <span>Lucro Estimado</span>
                <span className="text-xl">
                  {selectedProduct ? formatCurrency((selectedProduct.sellingPrice - selectedProduct.costPrice) * quantity) : 'R$ 0,00'}
                </span>
              </div>
              <div className="pt-4 space-y-2">
                <p className="text-xs text-white/40">O estoque será atualizado de {selectedProduct?.currentStock || 0} para {(selectedProduct?.currentStock || 0) - quantity} após a confirmação.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
