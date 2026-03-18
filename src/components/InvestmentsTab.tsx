import { useState, useMemo } from 'react';
import { Plus, TrendingUp, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Investment, Transaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface InvestmentsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function InvestmentsTab({ state, updateState }: InvestmentsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [contributingInv, setContributingInv] = useState<Investment | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('CDI');
  const [value, setValue] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');

  const resetForm = () => {
    setName('');
    setValue('');
    setType('CDI');
    setIsAdding(false);
    setEditingInvestment(null);
  };

  const handleSaveInvestment = () => {
    if (!name || !value) return;
    
    if (editingInvestment) {
      const updatedInvestments = state.investments.map(i => 
        i.id === editingInvestment.id 
          ? { 
              ...i, 
              name, 
              type, 
              investedValue: parseFloat(value),
              currentValue: parseFloat(value) // Resetting current value to invested for simplicity in edit
            } 
          : i
      );
      updateState({ investments: updatedInvestments });
    } else {
      const inv: Investment = {
        id: Date.now().toString(),
        name,
        type,
        investedValue: parseFloat(value),
        currentValue: parseFloat(value),
        yield: 0
      };
      updateState({ investments: [...state.investments, inv] });
    }
    resetForm();
  };

  const handleEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setName(inv.name);
    setType(inv.type);
    setValue(inv.investedValue.toString());
    setIsAdding(true);
  };

  const deleteInv = (id: string) => {
    updateState({ investments: state.investments.filter(i => i.id !== id) });
  };

  const handleAddMoney = () => {
    if (!contributingInv || !contributionAmount) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: `Aporte Investimento: ${contributingInv.name}`,
      amount: amount,
      type: 'expense',
      category: 'Investimento',
      date: new Date().toISOString(),
      paymentMethod: 'pix'
    };

    updateState({
      investments: state.investments.map(i => 
        i.id === contributingInv.id ? { ...i, investedValue: i.investedValue + amount, currentValue: i.currentValue + amount } : i
      ),
      transactions: [...state.transactions, newTransaction]
    });

    setContributingInv(null);
    setContributionAmount('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalInvested = state.investments.reduce((acc, i) => acc + i.investedValue, 0);
  const totalCurrent = state.investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;

  // Mock historical data for the chart
  const chartData = useMemo(() => {
    if (state.investments.length === 0) return [];
    
    const points = 7;
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (points - 1 - i) * 5);
      
      // Interpolate between invested and current with some noise
      const progress = i / (points - 1);
      const invested = totalInvested;
      const current = totalInvested + (totalCurrent - totalInvested) * progress;
      const noise = (Math.random() - 0.5) * (totalCurrent * 0.02);
      
      data.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        investido: invested,
        atual: Math.max(invested * 0.9, current + noise)
      });
    }
    return data;
  }, [totalInvested, totalCurrent, state.investments.length]);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Meus <span className="text-emerald-600">Investimentos</span></h2>
          <p className="text-slate-500 font-medium">Faça seu dinheiro trabalhar para você.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95 group"
        >
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          Novo Investimento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... existing cards ... */}
      </div>

      {/* Evolution Chart */}
      {state.investments.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Evolução do Patrimônio</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Desempenho dos últimos 30 dias (Simulado)</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-dark-border" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="atual" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
                <Line 
                  type="monotone" 
                  dataKey="investido" 
                  stroke="#cbd5e1" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 bg-white dark:bg-dark-card rounded-[2.5rem] border border-emerald-500/20 shadow-2xl shadow-emerald-600/5 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingInvestment ? 'Editar Investimento' : 'Adicionar Investimento'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Ativo</label>
              <input
                type="text"
                placeholder="Ex: Tesouro Selic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium appearance-none"
              >
                <option value="CDI">CDI</option>
                <option value="Tesouro">Tesouro Direto</option>
                <option value="Ações">Ações</option>
                <option value="Fundos">Fundos Imobiliários</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Investido (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleSaveInvestment}
              className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              {editingInvestment ? 'Atualizar' : 'Salvar'}
            </button>
            <button 
              onClick={resetForm}
              className="flex-1 py-4 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {contributingInv && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-dark-card p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-slate-200 dark:border-dark-border space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Aportar em {contributingInv.name}</h3>
              <p className="text-slate-500 font-medium">O valor será registrado como uma despesa e adicionado ao investimento.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Valor do Aporte</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">R$</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0,00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-[2rem] outline-none focus:border-emerald-600 text-4xl font-black tracking-tighter transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleAddMoney}
                  className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  Confirmar Aporte
                </button>
                <button 
                  onClick={() => setContributingInv(null)}
                  className="w-full py-5 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-6 md:hidden">
        {state.investments.length > 0 ? (
          state.investments.map((inv) => {
            const profit = inv.currentValue - inv.investedValue;
            return (
              <motion.div 
                key={inv.id}
                layout
                className="p-8 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{inv.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-dark-input rounded-lg text-slate-500 uppercase tracking-widest">
                        {inv.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setContributingInv(inv)}
                      className="p-2 text-emerald-600 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(inv)}
                      className="p-2 text-blue-600 rounded-lg bg-blue-50 dark:bg-dark-hover"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-dark-border relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(inv.investedValue)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Atual</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatCurrency(inv.currentValue)}</p>
                  </div>
                  <div className="col-span-2 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-input rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro Total</p>
                      <p className={cn("text-xl font-black tracking-tighter", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {formatCurrency(profit)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white dark:bg-dark-card rounded-[2.5rem] border border-dashed border-slate-200 dark:border-dark-border space-y-4">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-500 font-medium tracking-tight">Nenhum investimento cadastrado.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ativos em Carteira</h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Tempo Real
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-dark-input/50">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativo</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Atual</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {state.investments.length > 0 ? (
                state.investments.map((inv) => {
                  const profit = inv.currentValue - inv.investedValue;
                  return (
                    <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-dark-hover/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white tracking-tight">{inv.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-medium text-slate-600 dark:text-slate-400">{formatCurrency(inv.investedValue)}</td>
                      <td className="px-8 py-6 font-black text-emerald-600 tracking-tighter">{formatCurrency(inv.currentValue)}</td>
                      <td className="px-8 py-6">
                        <span className={cn("font-black tracking-tighter", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setContributingInv(inv)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                            title="Aportar"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteInv(inv.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="space-y-4">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium tracking-tight">Nenhum investimento cadastrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
