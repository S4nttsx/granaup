import { useState } from 'react';
import { Plus, TrendingUp, Trash2, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Investment } from '../types';

interface InvestmentsTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function InvestmentsTab({ state, updateState }: InvestmentsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('CDI');
  const [value, setValue] = useState('');

  const addInvestment = () => {
    if (!name || !value) return;
    const inv: Investment = {
      id: Date.now().toString(),
      name,
      type,
      investedValue: parseFloat(value),
      currentValue: parseFloat(value),
      yield: 0
    };
    updateState({ investments: [...state.investments, inv] });
    setName('');
    setValue('');
    setIsAdding(false);
  };

  const deleteInv = (id: string) => {
    updateState({ investments: state.investments.filter(i => i.id !== id) });
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
          <h2 className="text-3xl font-bold">Investimentos</h2>
          <p className="text-slate-500">Faça seu dinheiro trabalhar para você.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Investimento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total Investido</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Valor Atual</p>
          <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
          className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/30 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-4">Adicionar Investimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome (ex: Tesouro Selic)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={addInvestment} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl">Salvar</button>
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl">Cancelar</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 font-bold text-sm text-slate-500">NOME</th>
                <th className="p-4 font-bold text-sm text-slate-500">TIPO</th>
                <th className="p-4 font-bold text-sm text-slate-500">INVESTIDO</th>
                <th className="p-4 font-bold text-sm text-slate-500">ATUAL</th>
                <th className="p-4 font-bold text-sm text-slate-500">LUCRO</th>
                <th className="p-4 font-bold text-sm text-slate-500 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.investments.length > 0 ? (
                state.investments.map((inv) => {
                  const profit = inv.currentValue - inv.investedValue;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <span className="font-semibold">{inv.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold">
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
                        <button onClick={() => deleteInv(inv.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
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
