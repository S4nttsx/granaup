import { useState, useMemo } from 'react';
import { AppState } from '../types';
import { DollarSign, Calendar, Save, ArrowDownRight, ArrowUpRight, Wallet, Receipt } from 'lucide-react';
import { motion } from 'motion/react';
import ExpensesTab from './ExpensesTab';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface SalaryTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function SalaryTab({ state, updateState }: SalaryTabProps) {
  const [salaryInput, setSalaryInput] = useState(state.salary.toString());
  const [salaryDateInput, setSalaryDateInput] = useState(state.salaryDate || '');
  const [salaryObsInput, setSalaryObsInput] = useState(state.salaryObservation || '');

  const handleSaveSalary = () => {
    updateState({
      salary: parseFloat(salaryInput) || 0,
      salaryDate: salaryDateInput,
      salaryObservation: salaryObsInput
    });
    alert('Salário atualizado com sucesso!');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const getMonthlyValue = (t: any) => {
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();
      const startTotalMonths = tYear * 12 + tMonth;
      const targetTotalMonths = year * 12 + month;
      const diff = targetTotalMonths - startTotalMonths;

      if (t.parentTransactionId) {
        return (tMonth === month && tYear === year) ? t.amount : 0;
      }

      if (t.recurrence && t.recurrence !== 'none') {
        const hasChildThisMonth = state.transactions.some(child => 
          child.parentTransactionId === t.id && 
          new Date(child.date).getMonth() === month && 
          new Date(child.date).getFullYear() === year
        );
        if (hasChildThisMonth) return 0;

        const totalDuration = t.installments?.total || 999;
        if (t.recurrence === 'monthly') {
          if (diff >= 0 && diff < totalDuration) return t.amount;
        } else if (t.recurrence === 'yearly') {
          const diffYears = Math.floor(diff / 12);
          const monthMatch = (diff % 12) === 0;
          if (diffYears >= 0 && diffYears < totalDuration && monthMatch) return t.amount;
        }
        return 0;
      } else {
        if (!t.installments || t.installments.total <= 1) {
          return (tMonth === month && tYear === year) ? t.amount : 0;
        } else {
          const totalInstallments = t.installments.total;
          const installmentValue = t.amount / totalInstallments;
          if (diff >= 0 && diff < totalInstallments) return installmentValue;
          return 0;
        }
      }
    };

    const monthlyTransactions = state.transactions
      .map(t => ({ ...t, monthlyAmount: getMonthlyValue(t) }))
      .filter(t => t.monthlyAmount > 0);

    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense');
    const monthlyIncomes = monthlyTransactions.filter(t => t.type === 'income');

    const totalExpenses = monthlyExpenses.reduce((acc, t) => acc + t.monthlyAmount, 0);
    const totalIncome = monthlyIncomes.reduce((acc, t) => acc + t.monthlyAmount, 0);
    const totalSalary = state.salary + totalIncome;
    const remaining = totalSalary - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      totalSalary,
      remaining,
      recentExpenses: monthlyExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  }, [state.salary, state.transactions]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 lg:space-y-16">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
          Gestão de <span className="text-emerald-600">Salário e Despesas</span>
        </h2>
        <p className="text-xs lg:text-sm text-slate-500 font-medium max-w-lg mx-auto">Configure seu rendimento base e acompanhe o comprometimento da sua renda mensal com precisão.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-card p-5 sm:p-8 rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm space-y-6 lg:space-y-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Configuração Base</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">Defina seu salário líquido e dia de recebimento para cálculos automáticos.</p>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Salário Mensal Líquido</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">R$</span>
                <input 
                  type="number" 
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  onFocus={(e) => salaryInput === '0' && setSalaryInput('')}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-2xl outline-none focus:border-emerald-600 text-2xl font-black tracking-tighter transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Dia do Recebimento</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Ex: 05"
                  value={salaryDateInput}
                  onChange={(e) => setSalaryDateInput(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-xl outline-none focus:border-emerald-600 transition-all font-bold text-lg"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSalary}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
              Salvar Configurações
            </button>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-dark-card p-5 sm:p-8 rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm h-full flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="space-y-2 mb-6 lg:mb-8 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-600/10 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Saúde Financeira</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">Resumo de entradas e saídas do mês atual.</p>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="p-5 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/10 flex justify-between items-center group/item hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Renda Total</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Base + Extras</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.totalSalary)}</span>
              </div>

              <div className="p-5 bg-red-50/50 dark:bg-red-500/5 rounded-2xl border border-red-100/50 dark:border-red-500/10 flex justify-between items-center group/item hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-[0.2em]">Despesas</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Comprometido</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-red-600 tracking-tighter">{formatCurrency(stats.totalExpenses)}</span>
              </div>

              <div className="p-8 bg-slate-900 dark:bg-dark-input text-white rounded-3xl shadow-2xl flex justify-between items-center relative overflow-hidden group/saldo">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 bg-[length:200%_100%] animate-gradient" />
                <div className="relative z-10">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Saldo Livre</p>
                  <p className={cn("text-4xl font-black tracking-tighter", stats.remaining >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {formatCurrency(stats.remaining)}
                  </p>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Uso da Renda</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {stats.totalSalary > 0 ? Math.round((stats.totalExpenses / stats.totalSalary) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Expenses Management Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pt-8 border-t border-slate-200/60 dark:border-dark-border"
      >
        <div className="mb-8 text-center sm:text-left">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2.5 tracking-tight">
            <Receipt className="w-6 h-6 text-blue-600" />
            Detalhamento de Gastos
          </h3>
          <p className="text-sm text-slate-500 mt-1">Gerencie todas as suas transações vinculadas ao seu orçamento mensal.</p>
        </div>
        <ExpensesTab state={state} updateState={updateState} />
      </motion.section>

      <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-5 sm:p-8 rounded-3xl border border-emerald-100/50 dark:border-emerald-500/10 flex flex-col sm:flex-row items-center gap-6 group">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-emerald-600/30 group-hover:scale-110 transition-transform">
          <DollarSign className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Dica de Saúde Financeira</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Especialistas recomendam a regra 50-30-20: 50% para necessidades, 30% para desejos e 20% para poupança/investimentos. 
            Atualmente, suas despesas consomem <span className="font-black text-emerald-600">{stats.totalSalary > 0 ? Math.round((stats.totalExpenses / stats.totalSalary) * 100) : 0}%</span> da sua renda total.
          </p>
        </div>
      </div>
    </div>
  );
}
