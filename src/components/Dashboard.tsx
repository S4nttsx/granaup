import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard,
  Wallet,
  Receipt,
  Building2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppState, Transaction, TabType } from '../types';

interface DashboardProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  setActiveTab: (tab: TabType) => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard({ state, updateState, setActiveTab }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenseToDelete, setExpenseToDelete] = useState<Transaction | null>(null);

  const deleteExpense = (expense: Transaction) => {
    let updatedCards = [...state.cards];
    const idsToDelete = [expense.id];
    if (expense.recurrence && expense.recurrence !== 'none' && !expense.parentTransactionId) {
      state.transactions.forEach(t => {
        if (t.parentTransactionId === expense.id) {
          idsToDelete.push(t.id);
        }
      });
    }
    const transactionsToDelete = state.transactions.filter(t => idsToDelete.includes(t.id));
    transactionsToDelete.forEach(t => {
      if (t.paymentMethod === 'credito' && t.cardId) {
        updatedCards = updatedCards.map(c => {
          if (c.id === t.cardId) {
            return { ...c, currentBill: Math.max(0, c.currentBill - t.amount) };
          }
          return c;
        });
      }
    });
    updateState({ 
      transactions: state.transactions.filter(t => !idsToDelete.includes(t.id)),
      cards: updatedCards
    });
    setExpenseToDelete(null);
  };

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
      const startTotalMonths = tYear * 12 + tMonth;
      const targetTotalMonths = year * 12 + month;
      const diff = targetTotalMonths - startTotalMonths;

      if (t.recurrence && t.recurrence !== 'none') {
        if (t.recurrence === 'monthly') {
          const totalMonths = t.installments?.total || 1;
          if (diff >= 1 && diff <= totalMonths) return t.amount;
        } else if (t.recurrence === 'yearly') {
          const totalYears = t.installments?.total || 1;
          const diffYears = Math.floor(diff / 12);
          const monthMatch = (diff % 12) === 0;
          if (diffYears >= 1 && diffYears <= totalYears && monthMatch) return t.amount;
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

    const monthlyTransactions = state.transactions.map(t => ({
      ...t,
      monthlyAmount: getMonthlyValue(t)
    })).filter(t => t.monthlyAmount > 0);

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.monthlyAmount, 0);

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
    const totalSalary = state.salary + totalIncome;
    const remaining = totalSalary - totalSpent;

    return {
      salary: totalSalary,
      baseSalary: state.salary,
      extraIncome: totalIncome,
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

  const businessStats = useMemo(() => {
    if (!state.isCompanyMode) return null;
    
    const totalSales = (state.sales || []).reduce((acc, s) => acc + s.amount, 0);
    const totalBusinessExpenses = (state.transactions || [])
      .filter(t => t.category === 'Negócios' || t.category === 'Empresa')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return {
      sales: totalSales,
      expenses: totalBusinessExpenses,
      profit: totalSales - totalBusinessExpenses,
      customers: (state.customers || []).length,
      suppliers: (state.suppliers || []).length
    };
  }, [state]);

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

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-10">
      {/* Header & Navigation */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4 lg:gap-6">
        <div className="space-y-1.5 text-center xl:text-left">
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Olá, <span className="text-blue-600">Investidor</span>
          </h2>
          <p className="text-xs lg:text-sm text-slate-500 font-medium">Aqui está o resumo estratégico de {capitalizedMonth}.</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-dark-card p-1.5 rounded-2xl border border-slate-200/60 dark:border-dark-border shadow-sm group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          
          <button 
            onClick={() => changeMonth(-1)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-slate-400 hover:text-blue-600 relative z-10"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          
          <div className="flex flex-col items-center min-w-[120px] relative z-10">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">{capitalizedMonth}</span>
            <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{currentYear}</span>
          </div>

          <button 
            onClick={() => changeMonth(1)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-xl transition-all text-slate-400 hover:text-blue-600 relative z-10"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>

          {!isCurrentMonth && (
            <div className="h-6 w-[1px] bg-slate-100 dark:bg-dark-border mx-0.5 relative z-10" />
          )}

          {!isCurrentMonth && (
            <button 
              onClick={resetToCurrentMonth}
              className="px-3 py-1.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-1.5 relative z-10"
            >
              <CalendarIcon className="w-3 h-3" />
              Hoje
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedDate.getMonth()}-${selectedDate.getFullYear()}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6 lg:space-y-10"
        >
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <SummaryCard 
              label="Salário & Renda" 
              value={formatCurrency(stats.salary)} 
              icon={Wallet} 
              color="blue"
              trend="+2.5%"
              onClick={() => {
                const val = prompt('Novo salário base mensal:', stats.baseSalary.toString());
                if (val) updateState({ salary: parseFloat(val) });
              }}
            />
            <SummaryCard 
              label="Despesas Fixas" 
              value={formatCurrency(stats.expenses)} 
              icon={ArrowDownRight} 
              color="red"
              trend="-4%"
            />
            <SummaryCard 
              label="Fatura Cartões" 
              value={formatCurrency(stats.cards)} 
              icon={CreditCard} 
              color="amber"
              trend="+12%"
            />
            <SummaryCard 
              label="Saldo Restante" 
              value={formatCurrency(stats.remaining)} 
              icon={TrendingUp} 
              color={stats.remaining >= 0 ? 'emerald' : 'red'}
              trend={stats.remaining >= 0 ? '+8%' : '-2%'}
            />
          </div>

          {/* Business Summary if active */}
          {state.isCompanyMode && businessStats && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden bg-slate-900 dark:bg-dark-card p-6 rounded-2xl text-white shadow-2xl shadow-blue-900/30 group border border-white/5"
            >
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/10 blur-[80px] -mr-36 -mt-36 rounded-full transition-all duration-1000 group-hover:bg-blue-600/20" />
              
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center lg:text-left max-w-md">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 backdrop-blur-2xl border border-white/10 rounded-full">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-300">Corporate Hub</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter leading-tight">Gestão <span className="text-blue-400">Empresarial</span></h3>
                  <p className="text-blue-100/40 text-xs font-medium leading-relaxed">Acompanhe métricas cruciais e o crescimento do seu negócio em tempo real.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                  {[
                    { label: 'Vendas Totais', value: businessStats.sales, color: 'text-white' },
                    { label: 'Lucro Líquido', value: businessStats.profit, color: 'text-emerald-400' },
                    { label: 'Base Clientes', value: businessStats.customers, color: 'text-blue-400', isNumber: true }
                  ].map((item, idx) => (
                    <div key={idx} className="px-6 py-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-2xl text-center group hover:bg-white/10 transition-all duration-500">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-300/40 mb-1.5">{item.label}</p>
                      <p className={cn("text-xl font-black tracking-tighter", item.color)}>
                        {item.isNumber ? item.value : formatCurrency(item.value as number)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Section */}
            <div className="lg:col-span-2 card-base p-6 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Fluxo de <span className="text-blue-600">Capital</span></h3>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Distribuição Estratégica de Recursos</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-9 h-9 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/20">
                    <PieChartIcon className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full relative z-10">
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-dark-card p-3 rounded-xl shadow-2xl border border-slate-100 dark:border-dark-border backdrop-blur-xl bg-white/90">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                                  <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(payload[0].value as number)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={30}
                          iconType="circle"
                          formatter={(value) => <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] px-2">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Alocado</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mt-0.5">{formatCurrency(stats.totalSpent)}</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center border border-slate-100 dark:border-dark-border">
                      <PieChartIcon className="w-7 h-7 opacity-20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest italic opacity-50">Sem dados para este período</p>
                  </div>
                )}
              </div>
            </div>

            {/* Forecast & Future Section */}
            <div className="space-y-5">
              <div className="card-base p-6 space-y-6">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Projeção</h3>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Próximo Ciclo Financeiro</p>
                </div>

                <div className="space-y-2.5">
                  <ForecastItem label="Parcelamentos" value={nextMonthForecast.installments} />
                  <ForecastItem label="Custo Fixo" value={nextMonthForecast.fixed} />
                  <ForecastItem label="Fatura Prevista" value={nextMonthForecast.cards} />
                  
                  <div className="pt-5 mt-5 border-t border-slate-100 dark:border-dark-border space-y-3">
                    <div className="flex justify-between items-center px-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Estimado</span>
                      <span className="text-xl font-black text-red-600 tracking-tighter">{formatCurrency(nextMonthForecast.total)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-dark-input rounded-xl border border-slate-100 dark:border-dark-border flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Sobra Livre</span>
                      </div>
                      <span className={cn(
                        "text-lg font-black tracking-tighter",
                        nextMonthForecast.remaining >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {formatCurrency(nextMonthForecast.remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base p-6 space-y-6">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Agenda</h3>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Compromissos Futuros</p>
                </div>

                <div className="space-y-2.5">
                  {futureInstallments.length > 0 ? futureInstallments.map(([month, value]) => (
                    <div key={month} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-dark-input rounded-xl border border-slate-100 dark:border-dark-border group hover:border-blue-600/30 transition-all cursor-default">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-white dark:bg-dark-card rounded-lg flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                          <CalendarIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{month}</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(value)}</span>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Nenhum compromisso</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card-base p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="space-y-0.5 text-center sm:text-left">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Extrato Mensal</h3>
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Movimentações em {capitalizedMonth}</p>
              </div>
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
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 group"
              >
                <Plus className="w-4.5 h-4.5 transition-transform group-hover:rotate-90" />
                <span className="text-[9px] font-black uppercase tracking-[0.15em]">Nova Transação</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const month = selectedDate.getMonth();
                const year = selectedDate.getFullYear();
                
                const getMonthlyValue = (t: Transaction) => {
                  const tDate = new Date(t.date);
                  const tMonth = tDate.getMonth();
                  const tYear = tDate.getFullYear();
                  const startTotalMonths = tYear * 12 + tMonth;
                  const targetTotalMonths = year * 12 + month;
                  const diff = targetTotalMonths - startTotalMonths;

                  if (t.recurrence && t.recurrence !== 'none') {
                    if (t.recurrence === 'monthly') {
                      const totalMonths = t.installments?.total || 1;
                      if (diff >= 1 && diff <= totalMonths) return t.amount;
                    } else if (t.recurrence === 'yearly') {
                      const totalYears = t.installments?.total || 1;
                      const diffYears = Math.floor(diff / 12);
                      const monthMatch = (diff % 12) === 0;
                      if (diffYears >= 1 && diffYears <= totalYears && monthMatch) return t.amount;
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

                const filtered = state.transactions
                  .map(t => ({ ...t, monthlyAmount: getMonthlyValue(t) }))
                  .filter(t => t.monthlyAmount > 0);

                if (filtered.length > 0) {
                  return filtered.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border hover:border-blue-600/40 transition-all group gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110",
                          t.type === 'income' ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-red-500 text-white shadow-red-500/30"
                        )}>
                          {t.type === 'income' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none">{t.description}</p>
                            {t.installments && t.installments.total > 1 && (
                              <span className="text-[7px] px-2 py-0.5 bg-blue-600 text-white rounded-full font-black uppercase tracking-[0.15em]">
                                {(() => {
                                  const tDate = new Date(t.date);
                                  const diff = (year * 12 + month) - (tDate.getFullYear() * 12 + tDate.getMonth());
                                  return `${diff + 1}/${t.installments.total}`;
                                })()}x
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              {t.paymentMethod === 'credito' ? `Cartão ${state.cards.find(c => c.id === t.cardId)?.name || ''}` : t.paymentMethod || t.category}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-dark-border" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-center sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                        <div className="text-left sm:text-right">
                          <p className={cn(
                            "text-xl font-black tracking-tighter",
                            t.type === 'income' ? "text-emerald-600" : "text-red-600"
                          )}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.monthlyAmount)}
                          </p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Processado</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              updateState({ editingTransactionId: t.id });
                              setActiveTab('salario');
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(t)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                }
                return (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-dark-border">
                      <Receipt className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Nenhuma atividade registrada</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {expenseToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-dark-border"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Excluir Transação?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Você está prestes a excluir <span className="font-bold text-slate-900 dark:text-white">"{expenseToDelete.description}"</span>.
                </p>
                {expenseToDelete.recurrence && expenseToDelete.recurrence !== 'none' && !expenseToDelete.parentTransactionId && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                      ⚠️ Esta é uma despesa recorrente. Excluí-la removerá todas as parcelas/ocorrências futuras associadas.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="py-4 px-6 bg-slate-100 dark:bg-dark-input text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-dark-hover transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteExpense(expenseToDelete)}
                  className="py-4 px-6 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-600/30 hover:bg-red-700 transition-all"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, trend, onClick }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={onClick}
      className={cn(
        "p-4 sm:p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm flex flex-col gap-4 group transition-all duration-500 relative overflow-hidden",
        onClick && "cursor-pointer hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-600/10"
      )}
    >
      <div className={cn("absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 blur-3xl opacity-20 transition-opacity group-hover:opacity-40", colors[color]?.split(' ')[0])} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 border shadow-lg",
          colors[color] || colors.blue
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border",
            colors[color] || colors.blue
          )}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

function ForecastItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="font-bold text-slate-900 dark:text-white tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</span>
    </div>
  );
}
