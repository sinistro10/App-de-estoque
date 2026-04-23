import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { InventoryStats } from '../types';
import { Users, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setStats(db.getStats());
    setChartData(db.getPerformanceData());
  }, []);

  if (!stats) return null;

  const cards = [
    { 
      title: 'Total em Estoque', 
      value: `${stats.totalItems}`, 
      suffix: 'un',
      color: 'text-slate-900',
      description: 'Total de itens ativos'
    },
    { 
      title: 'Custo Total Ativo', 
      value: formatCurrency(stats.totalValueCost), 
      suffix: '',
      color: 'text-slate-900',
      description: 'Capital investido em estoque'
    },
    { 
      title: 'Estoque Baixo', 
      value: `${stats.lowStockItems}`, 
      suffix: 'itens',
      color: stats.lowStockItems > 0 ? 'text-rose-600' : 'text-emerald-600',
      description: 'Necessitam reposição'
    },
    { 
      title: 'Lucro Esperado', 
      value: formatCurrency(stats.expectedProfit), 
      suffix: '',
      color: 'text-white',
      bg: 'bg-indigo-600 border-indigo-700',
      description: 'Projeção de lucro total',
      isHighlight: true
    },
  ];

  return (
    <div className="space-y-8">
      {/* Urgent Alerts */}
      {stats.lowStockItems > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-rose-900">Atenção: Itens com estoque crítico!</h4>
              <p className="text-rose-700 text-sm">Existem {stats.lowStockItems} produtos que atingiram ou estão abaixo do nível mínimo de segurança.</p>
            </div>
          </div>
          <button 
            onClick={() => {}} // This is handled in parent commonly but Dashboard is local. 
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-colors hidden sm:block"
          >
            Resolver Agora
          </button>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className={cn(
              "p-5 rounded-xl border shadow-sm transition-all hover:shadow-md",
              card.bg || "bg-white border-slate-200"
            )}
          >
            <p className={cn(
              "text-xs font-semibold uppercase tracking-wider mb-1",
              card.isHighlight ? "text-indigo-200" : "text-slate-500"
            )}>
              {card.title}
            </p>
            <p className={cn("text-2xl font-bold truncate", card.color)}>
              {card.value} {card.suffix && <span className={cn("text-sm font-normal", card.isHighlight ? "opacity-60" : "text-slate-400")}>{card.suffix}</span>}
            </p>
            <p className={cn(
              "text-[10px] mt-2 font-medium uppercase",
              card.isHighlight ? "text-indigo-200" : "text-slate-400"
            )}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Desempenho Semanal</h3>
            <span className="text-xs text-indigo-600 font-semibold cursor-pointer">Ver Detalhes</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelFormatter={(label) => `Data: ${label}`}
                  formatter={(value: number) => [formatCurrency(value), 'Lucro']}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Profit */}
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Faturamento vs Lucro</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="Faturamento" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
