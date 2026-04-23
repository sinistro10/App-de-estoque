/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Menu, 
  X,
  CreditCard,
  Settings,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Transactions from './components/Transactions';
import { db } from './lib/db';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'inventory' | 'sales' | 'transactions';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  React.useEffect(() => {
    // Check for low stock on mount and every few seconds
    const checkStock = () => {
      setLowStockProducts(db.getLowStockProducts());
    };
    
    checkStock();
    const interval = setInterval(checkStock, 5000);
    return () => clearInterval(interval);
  }, [activeView]); // Re-check when switching views or performing actions

  const navigation = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque de Produtos', icon: Package },
    { id: 'sales', label: 'Realizar Venda', icon: ShoppingCart },
    { id: 'transactions', label: 'Histórico', icon: History },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'sales': return <Sales />;
      case 'transactions': return <Transactions />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col fixed inset-y-0 z-40 lg:relative",
        isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0">
            <Package size={20} />
          </div>
          {isSidebarOpen && (
            <span className="ml-3 font-bold text-white text-lg tracking-tight whitespace-nowrap">EstoqueMaster</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-lg transition-all group",
                activeView === item.id 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                activeView === item.id ? "text-white" : "text-slate-500 group-hover:text-white"
              )} />
              {isSidebarOpen && <span className="ml-3 text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">AD</div>
            {isSidebarOpen && (
              <div className="text-xs">
                <p className="text-white font-medium">Administrador</p>
                <p className="text-slate-500">Premium Access</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 lg:hidden"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {navigation.find(n => n.id === activeView)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 relative transition-colors"
                title="Notificações"
              >
                <Bell size={20} />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Notificações</h3>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full uppercase">
                          {lowStockProducts.length} Alerta{lowStockProducts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {lowStockProducts.length > 0 ? (
                          lowStockProducts.map(p => (
                            <div 
                              key={p.id} 
                              className="p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
                              onClick={() => { setActiveView('inventory'); setShowNotifications(false); }}
                            >
                              <div className="flex gap-3">
                                <div className="p-2 bg-rose-50 rounded-lg text-rose-600 shrink-0">
                                  <AlertTriangle size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 leading-tight">Estoque Baixo: {p.name}</p>
                                  <p className="text-xs text-slate-500 mt-1">Apenas {p.currentStock} unidades restantes. (Mínimo: {p.minStock})</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400">
                            <Bell size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Sem novas notificações</p>
                          </div>
                        )}
                      </div>
                      {lowStockProducts.length > 0 && (
                        <button 
                          onClick={() => { setActiveView('inventory'); setShowNotifications(false); }}
                          className="w-full p-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border-t border-slate-100 transition-colors"
                        >
                          Ver todas no estoque
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm" onClick={() => setActiveView('sales')}>
                + Nova Venda
              </button>
              <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors" onClick={() => setActiveView('inventory')}>
                Gerir Estoque
              </button>
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

