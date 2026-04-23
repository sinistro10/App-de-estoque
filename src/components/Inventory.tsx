import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Product } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [priceType, setPriceType] = useState<'cost' | 'selling'>('selling');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<'IN' | 'OUT'>('IN');
  const [stockQuantity, setStockQuantity] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    minStock: 0,
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(db.getProducts());
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    const matchesStatus = stockStatus === 'all' || (
      stockStatus === 'in_stock' ? p.currentStock > p.minStock :
      stockStatus === 'low_stock' ? (p.currentStock <= p.minStock && p.currentStock > 0) :
      stockStatus === 'out_of_stock' ? p.currentStock === 0 : true
    );

    // Advanced Price Filter
    const priceToCompare = priceType === 'cost' ? p.costPrice : p.sellingPrice;
    const matchesMinPrice = minPrice === '' || priceToCompare >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || priceToCompare <= parseFloat(maxPrice);

    // Advanced Date Filter
    const createdAtTime = new Date(p.createdAt).getTime();
    const matchesStartDate = startDate === '' || createdAtTime >= new Date(startDate).getTime();
    const matchesEndDate = endDate === '' || createdAtTime <= new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // end of day

    return matchesSearch && matchesCategory && matchesStatus && matchesMinPrice && matchesMaxPrice && matchesStartDate && matchesEndDate;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      db.updateProduct({ ...selectedProduct, ...formData });
    } else {
      db.addProduct({ ...formData, currentStock: 0 });
    }
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormData({ name: '', sku: '', description: '', costPrice: 0, sellingPrice: 0, minStock: 0, category: '' });
    loadProducts();
  };

  const handleStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      db.registerTransaction({
        productId: selectedProduct.id,
        type: stockAction,
        quantity: stockQuantity,
        price: stockAction === 'IN' ? selectedProduct.costPrice : selectedProduct.sellingPrice,
        totalValue: (stockAction === 'IN' ? selectedProduct.costPrice : selectedProduct.sellingPrice) * stockQuantity,
        note: stockAction === 'IN' ? 'Entrada manual' : 'Saída manual',
      });
      setIsStockModalOpen(false);
      setStockQuantity(1);
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Estoque de Produtos</h2>
        <button 
          onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row bg-white p-4 border border-slate-200 rounded-xl shadow-sm gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou SKU..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select 
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white min-w-[140px]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Todas Categorias</option>
                {categories.filter(c => c !== 'all').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <select 
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white min-w-[140px]"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              <option value="all">Todo Status</option>
              <option value="in_stock">Em estoque</option>
              <option value="low_stock">Estoque Baixo</option>
              <option value="out_of_stock">Sem estoque</option>
            </select>

            <button
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2",
                isAdvancedSearchOpen ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              Busca Avançada
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isAdvancedSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Faixa de Preço</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPriceType('selling')}
                        className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", priceType === 'selling' ? "bg-indigo-100 text-indigo-700" : "text-slate-400")}
                      >
                        Venda
                      </button>
                      <button 
                        onClick={() => setPriceType('cost')}
                        className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", priceType === 'cost' ? "bg-indigo-100 text-indigo-700" : "text-slate-400")}
                      >
                        Custo
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number" 
                      placeholder="Min (R$)" 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Max (R$)" 
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data de Cadastro</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block px-1">De:</span>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block px-1">Até:</span>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end pb-1">
                  <button 
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-xs text-rose-600 font-bold uppercase hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  >
                    Limpar Filtros Avançados
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[460px] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Itens em Destaque</h2>
          <span className="text-xs text-indigo-600 font-semibold cursor-pointer">Ver todos</span>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3 border-b border-slate-100">Produto</th>
                <th className="px-6 py-3 border-b border-slate-100 text-center">SKU</th>
                <th className="px-6 py-3 border-b border-slate-100 text-center">Qtd</th>
                <th className="px-6 py-3 border-b border-slate-100">Custo (Un)</th>
                <th className="px-6 py-3 border-b border-slate-100">Venda (Un)</th>
                <th className="px-6 py-3 border-b border-slate-100 text-right">Status / Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4 text-center font-semibold">{p.currentStock}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(p.costPrice)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className={cn(
                        "px-2 py-1 text-[10px] rounded-full uppercase font-bold",
                        p.currentStock <= p.minStock 
                          ? (p.currentStock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")
                          : "bg-emerald-100 text-emerald-700"
                      )}>
                        {p.currentStock === 0 ? 'Sem Estoque' : (p.currentStock <= p.minStock ? 'Baixo' : 'Em estoque')}
                      </span>
                      <div className="h-4 w-px bg-slate-200" />
                      <button 
                        onClick={() => { setSelectedProduct(p); setStockAction('IN'); setIsStockModalOpen(true); }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Entrada"
                      >
                        <ArrowUpRight size={16} />
                      </button>
                      <button 
                        onClick={() => { setSelectedProduct(p); setStockAction('OUT'); setIsStockModalOpen(true); }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Saída"
                      >
                        <ArrowDownRight size={16} />
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedProduct(p); 
                          setFormData({
                            name: p.name,
                            sku: p.sku,
                            description: p.description,
                            costPrice: p.costPrice,
                            sellingPrice: p.sellingPrice,
                            minStock: p.minStock,
                            category: p.category,
                          });
                          setIsModalOpen(true); 
                        }}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-slate-500">Nenhum produto encontrado.</div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative my-auto"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.sku}
                      onChange={e => setFormData({...formData, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço Custo</label>
                    <input 
                      required
                      type="number" step="0.01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.costPrice}
                      onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda</label>
                    <input 
                      required
                      type="number" step="0.01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.sellingPrice}
                      onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                    <input 
                      required
                      type="number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.minStock}
                      onChange={e => setFormData({...formData, minStock: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Update Modal */}
      <AnimatePresence>
        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {stockAction === 'IN' ? 'Dar Entrada' : 'Registrar Saída'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">{selectedProduct?.name}</p>
              
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={stockQuantity}
                    onChange={e => setStockQuantity(parseInt(e.target.value))}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsStockModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={cn(
                      "flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors shadow-sm",
                      stockAction === 'IN' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
