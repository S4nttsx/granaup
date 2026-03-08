import { useState } from 'react';
import { Plus, TrendingUp, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Investment, Transaction } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 dark:text-white">Investimentos</h2>
          <p className="text-slate-500">Faça seu dinheiro trabalhar para você.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Investimento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Investido</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Valor Atual</p>
          <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Lucro/Prejuízo Total</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-2xl font-bold", totalProfit >= 0 ? "text-emerald-500" : "text-red-500")}>
              {formatCurrency(totalProfit)}
            </p>
            {totalProfit !== 0 && (totalProfit > 0 ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-red-500" />)}
          </div>
        </div>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-dark-card rounded-3xl border-2 border-blue-500/30 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-white">
            {editingInvestment ? 'Editar Investimento' : 'Adicionar Investimento'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome (ex: Tesouro Selic)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CDI">CDI</option>
              <option value="Tesouro">Tesouro Direto</option>
              <option value="Ações">Ações</option>
              <option value="Fundos">Fundos Imobiliários</option>
              <option value="Outros">Outros</option>
            </select>
            <input
              type="number"
              placeholder="Valor Investido (R$)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveInvestment} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
              {editingInvestment ? 'Atualizar' : 'Salvar'}
            </button>
            <button onClick={resetForm} className="px-6 py-2 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-xl">Cancelar</button>
          </div>
        </motion.div>
      )}

      {contributingInv && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-dark-border">
            <h3 className="text-2xl font-bold mb-2 text-blue-600 dark:text-white">Aportar em {contributingInv.name}</h3>
            <p className="text-slate-500 mb-6 text-sm">O valor será abatido do seu salário mensal.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">VALOR DO APORTE (R$)</label>
                <input
                  autoFocus
                  type="number"
                  placeholder="0,00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-2xl outline-none focus:border-blue-500 text-2xl font-bold"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAddMoney}
                  className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                >
                  Confirmar Aporte
                </button>
                <button 
                  onClick={() => setContributingInv(null)}
                  className="px-6 py-4 bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-slate-400 font-bold rounded-2xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {state.investments.length > 0 ? (
          state.investments.map((inv) => {
            const profit = inv.currentValue - inv.investedValue;
            return (
              <motion.div 
                key={inv.id}
                layout
                className="p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{inv.name}</h4>
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-dark-input rounded-full text-slate-500">
                        {inv.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setContributingInv(inv)}
                      className="p-2 text-emerald-500 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(inv)}
                      className="p-2 text-blue-500 rounded-lg bg-blue-50 dark:bg-dark-hover"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteInv(inv.id)}
                      className="p-2 text-red-500 rounded-lg bg-red-50 dark:bg-red-900/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-dark-border">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Investido</p>
                    <p className="font-bold">{formatCurrency(inv.investedValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Valor Atual</p>
                    <p className="font-bold text-emerald-500">{formatCurrency(inv.currentValue)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Lucro</p>
                    <p className={cn("font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {formatCurrency(profit)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-10 text-center text-slate-400 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-slate-200 dark:border-dark-border">
            Nenhum investimento cadastrado.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-dark-input/50">
                <th className="p-4 font-bold text-sm text-slate-500">NOME</th>
                <th className="p-4 font-bold text-sm text-slate-500">TIPO</th>
                <th className="p-4 font-bold text-sm text-slate-500">INVESTIDO</th>
                <th className="p-4 font-bold text-sm text-slate-500">ATUAL</th>
                <th className="p-4 font-bold text-sm text-slate-500">LUCRO</th>
                <th className="p-4 font-bold text-sm text-slate-500 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {state.investments.length > 0 ? (
                state.investments.map((inv) => {
                  const profit = inv.currentValue - inv.investedValue;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-dark-hover/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <span className="font-semibold">{inv.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-dark-input rounded-full text-xs font-bold">
                          {inv.type}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{formatCurrency(inv.investedValue)}</td>
                      <td className="p-4 font-bold text-emerald-500">{formatCurrency(inv.currentValue)}</td>
                      <td className="p-4">
                        <span className={cn("font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {formatCurrency(profit)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setContributingInv(inv)}
                            className="p-2 text-emerald-500 md:text-slate-400 md:hover:text-emerald-500 transition-colors"
                            title="Aportar"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(inv)} className="p-2 text-blue-500 md:text-slate-400 md:hover:text-blue-500 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteInv(inv.id)} className="p-2 text-red-500 md:text-slate-400 md:hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    Nenhum investimento cadastrado.
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
