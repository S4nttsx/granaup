import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppState, Transaction } from '../types';

interface DashboardProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard({ state, updateState }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonthName = selectedDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);
  const currentYear = selectedDate.getFullYear();

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();
  }, [selectedDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const resetToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const stats = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    const getMonthlyValue = (t: Transaction) => {
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      if (!t.installments || t.installments.total <= 1) {
        return (tMonth === month && tYear === year) ? t.amount : 0;
      } else {
        const totalInstallments = t.installments.total;
        const installmentValue = t.amount / totalInstallments;
        
        const startTotalMonths = tYear * 12 + tMonth;
        const targetTotalMonths = year * 12 + month;
        const diff = targetTotalMonths - startTotalMonths;

        if (diff >= 0 && diff < totalInstallments) {
          return installmentValue;
        }
        return 0;
      }
    };

    const monthlyTransactions = state.transactions.map(t => ({
      ...t,
      monthlyAmount: getMonthlyValue(t)
    })).filter(t => t.monthlyAmount > 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense' && t.paymentMethod !== 'credito')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);
    
    const totalCards = monthlyTransactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'credito')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);

    const totalGoals = state.goals.reduce((acc, g) => acc + g.currentValue, 0);
    const totalInvestments = state.investments.reduce((acc, i) => acc + i.currentValue, 0);
    const totalCrypto = state.cryptos.reduce((acc, c) => acc + (c.amount * c.currentPrice), 0);
    
    const totalSpent = totalExpenses + totalCards;
    const remaining = state.salary - totalSpent;

    return {
      salary: state.salary,
      expenses: totalExpenses,
      goals: totalGoals,
      investments: totalInvestments,
      crypto: totalCrypto,
      cards: totalCards,
      totalSpent,
      remaining
    };
  }, [state, selectedDate]);

  const chartData = [
    { name: 'Despesas', value: stats.expenses, color: '#ef4444' },
    { name: 'Cartão', value: stats.cards, color: '#3b82f6' },
    { name: 'Metas', value: stats.goals, color: '#8b5cf6' },
    { name: 'Investimentos', value: stats.investments + stats.crypto, color: '#10b981' },
    { name: 'Sobra', value: Math.max(0, stats.remaining), color: '#34d399' },
  ].filter(d => d.value > 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const futureInstallments = useMemo(() => {
    const months: Record<string, number> = {};
    const today = new Date();
    
    state.transactions.forEach(t => {
      if (t.installments && t.installments.total > 1) {
        const tDate = new Date(t.date);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        const startTotalMonths = tYear * 12 + tMonth;
        const todayTotalMonths = today.getFullYear() * 12 + today.getMonth();
        
        const installmentValue = t.amount / t.installments.total;
        
        for (let i = 1; i <= 4; i++) {
          const futureTotalMonths = todayTotalMonths + i;
          const diff = futureTotalMonths - startTotalMonths;
          
          if (diff >= 0 && diff < t.installments.total) {
            const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthName = futureDate.toLocaleString('pt-BR', { month: 'long' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            months[capitalizedMonth] = (months[capitalizedMonth] || 0) + installmentValue;
          }
        }
      }
    });
    
    return Object.entries(months);
  }, [state.transactions]);

  const nextMonthForecast = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nmMonth = nextMonth.getMonth();
    const nmYear = nextMonth.getFullYear();
    const nmTotalMonths = nmYear * 12 + nmMonth;

    let installmentsTotal = 0;
    let fixedExpensesTotal = 0;
    let cardBillsTotal = 0;

    state.transactions.forEach(t => {
      if (t.type === 'expense') {
        const tDate = new Date(t.date);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        const startTotalMonths = tYear * 12 + tMonth;

        if (t.installments && t.installments.total > 1) {
          const diff = nmTotalMonths - startTotalMonths;
          if (diff >= 0 && diff < t.installments.total) {
            installmentsTotal += t.amount / t.installments.total;
          }
        } else if (t.recurrence && t.recurrence !== 'none') {
          fixedExpensesTotal += t.amount;
        } else if (t.paymentMethod === 'credito' && tMonth === nmMonth && tYear === nmYear) {
          // This would be single credit card purchases in next month, 
          // but usually forecast is for what's already committed.
        }
      }
    });

    // Card bills for next month are basically the installments of next month that are on cards
    cardBillsTotal = state.transactions
      .filter(t => t.type === 'expense' && t.paymentMethod === 'credito')
      .reduce((acc, t) => {
        const tDate = new Date(t.date);
        const startTotalMonths = tDate.getFullYear() * 12 + tDate.getMonth();
        const diff = nmTotalMonths - startTotalMonths;
        if (t.installments && t.installments.total > 1) {
          if (diff >= 0 && diff < t.installments.total) return acc + (t.amount / t.installments.total);
        } else {
          if (diff === 0) return acc + t.amount;
        }
        return acc;
      }, 0);

    const totalForecast = installmentsTotal + fixedExpensesTotal; // cardBillsTotal is already in installmentsTotal if they are installments
    // Wait, let's separate them clearly as the UI does.
    
    // Recalculate installments specifically for non-card
    const nonCardInstallments = state.transactions
      .filter(t => t.type === 'expense' && t.paymentMethod !== 'credito' && t.installments && t.installments.total > 1)
      .reduce((acc, t) => {
        const tDate = new Date(t.date);
        const diff = nmTotalMonths - (tDate.getFullYear() * 12 + tDate.getMonth());
        if (diff >= 0 && diff < t.installments!.total) return acc + (t.amount / t.installments!.total);
        return acc;
      }, 0);

    const totalSpentForecast = nonCardInstallments + fixedExpensesTotal + cardBillsTotal;
    const remainingForecast = state.salary - totalSpentForecast;

    return {
      installments: nonCardInstallments,
      fixed: fixedExpensesTotal,
      cards: cardBillsTotal,
      total: totalSpentForecast,
      remaining: remainingForecast
    };
  }, [state.transactions, state.salary]);

  return (
    <div className="space-y-8">
      {/* Month Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-dark-card p-4 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-blue-600 dark:text-slate-400"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center min-w-[150px]">
            <span className="text-xl font-bold text-blue-600 dark:text-white">{capitalizedMonth}</span>
            <span className="text-xs text-slate-500 font-medium">{currentYear}</span>
          </div>
          <button 
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-blue-600 dark:text-slate-400"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        {!isCurrentMonth && (
          <button 
            onClick={resetToCurrentMonth}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all text-sm"
          >
            <CalendarIcon className="w-4 h-4" />
            Mês Atual
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedDate.getMonth()}-${selectedDate.getFullYear()}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Monthly Summary Card */}
          <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-white mb-1">Resumo de {capitalizedMonth}</h3>
                <p className="text-slate-500">Visão geral das suas finanças para este período.</p>
              </div>
              <div className="px-6 py-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                <p className="text-xs font-bold uppercase mb-1 opacity-80">Salário</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.salary)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Despesas</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(stats.expenses)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Cartão</p>
                <p className="text-lg font-bold text-blue-500">{formatCurrency(stats.cards)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Gasto</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{formatCurrency(stats.totalSpent)}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Sobra</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.remaining)}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-dark-hover/50 rounded-2xl border border-blue-100 dark:border-dark-border col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Investimentos</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.investments + stats.crypto)}</p>
              </div>
            </div>
          </div>

          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Salário Mensal" 
              value={formatCurrency(stats.salary)} 
              icon={DollarSign} 
              color="blue"
              onClick={() => {
                const val = prompt('Novo salário mensal:', state.salary.toString());
                if (val) updateState({ salary: parseFloat(val) });
              }}
            />
            <StatCard title="Despesas do Mês" value={formatCurrency(stats.expenses)} icon={TrendingDown} color="red" />
            <StatCard title="Fatura Cartões" value={formatCurrency(stats.cards)} icon={CreditCard} color="blue" />
            <StatCard 
              title="Saldo Restante" 
              value={formatCurrency(stats.remaining)} 
              icon={PieChartIcon} 
              color={stats.remaining >= 0 ? 'emerald' : 'red'} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-600 dark:text-white">
                <PieChartIcon className="w-5 h-5 text-emerald-500" />
                Distribuição de Gastos
              </h3>
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    Adicione dados para ver o gráfico
                  </div>
                )}
              </div>
            </div>

            {/* Forecast Section */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-white">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Previsão Próximo Mês
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Parcelas:</span>
                    <span className="font-bold text-blue-600 dark:text-white">{formatCurrency(nextMonthForecast.installments)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Despesas Fixas:</span>
                    <span className="font-bold text-blue-600 dark:text-white">{formatCurrency(nextMonthForecast.fixed)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Cartão:</span>
                    <span className="font-bold text-blue-600 dark:text-white">{formatCurrency(nextMonthForecast.cards)}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-dark-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 font-bold">Total Previsto:</span>
                      <span className="font-bold text-red-500">{formatCurrency(nextMonthForecast.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">Sobra Prevista:</span>
                      <span className={cn("font-bold", nextMonthForecast.remaining >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {formatCurrency(nextMonthForecast.remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-white">
                  <ArrowUpRight className="w-5 h-5 text-blue-500" />
                  Parcelas Futuras
                </h3>
                <div className="space-y-3">
                  {futureInstallments.length > 0 ? futureInstallments.map(([month, value]) => (
                    <div key={month} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-dark-input">
                      <span className="text-sm font-medium text-blue-600 dark:text-slate-300">{month}</span>
                      <span className="font-bold text-blue-600 dark:text-white">{formatCurrency(value)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-4">Sem parcelas futuras.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-blue-600 dark:text-white">Transações do Mês</h3>
              <button 
                onClick={() => {
                  const desc = prompt('Descrição:');
                  const amount = prompt('Valor:');
                  if (desc && amount) {
                    const newTransaction: Transaction = {
                      id: Date.now().toString(),
                      description: desc,
                      amount: parseFloat(amount),
                      type: 'expense',
                      category: 'Outros',
                      date: selectedDate.toISOString()
                    };
                    updateState({ transactions: [newTransaction, ...state.transactions] });
                  }
                }}
                className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {(() => {
                const month = selectedDate.getMonth();
                const year = selectedDate.getFullYear();
                
                const getMonthlyValue = (t: Transaction) => {
                  const tDate = new Date(t.date);
                  const tMonth = tDate.getMonth();
                  const tYear = tDate.getFullYear();

                  if (!t.installments || t.installments.total <= 1) {
                    return (tMonth === month && tYear === year) ? t.amount : 0;
                  } else {
                    const totalInstallments = t.installments.total;
                    const installmentValue = t.amount / totalInstallments;
                    const startTotalMonths = tYear * 12 + tMonth;
                    const targetTotalMonths = year * 12 + month;
                    const diff = targetTotalMonths - startTotalMonths;
                    if (diff >= 0 && diff < totalInstallments) return installmentValue;
                    return 0;
                  }
                };

                const filtered = state.transactions
                  .map(t => ({ ...t, monthlyAmount: getMonthlyValue(t) }))
                  .filter(t => t.monthlyAmount > 0);

                if (filtered.length > 0) {
                  return filtered.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-dark-input">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-blue-600 dark:text-white">{t.description}</p>
                            {t.installments && t.installments.total > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-dark-input text-blue-500 rounded font-bold">
                                {(() => {
                                  const tDate = new Date(t.date);
                                  const diff = (year * 12 + month) - (tDate.getFullYear() * 12 + tDate.getMonth());
                                  return `${diff + 1}/${t.installments.total}`;
                                })()}x
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {t.paymentMethod === 'credito' ? `Cartão ${state.cards.find(c => c.id === t.cardId)?.name || ''}` : t.paymentMethod || ''}
                            {t.paymentMethod && ' • '}
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-bold",
                        t.type === 'income' ? "text-emerald-500" : "text-red-500"
                      )}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.monthlyAmount)}
                      </span>
                    </div>
                  ));
                }
                return <p className="text-center text-slate-400 py-8">Nenhuma transação registrada para este mês.</p>
              })()}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, onClick }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={cn(
        "p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm flex items-center gap-4",
        onClick && "cursor-pointer hover:border-blue-500 transition-colors"
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color] || colors.emerald)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function DistributionRow({ label, percent, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-dark-input rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
