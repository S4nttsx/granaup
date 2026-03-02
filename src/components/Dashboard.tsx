import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion } from 'motion/react';
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
  const stats = useMemo(() => {
    const totalExpenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalGoals = state.goals.reduce((acc, g) => acc + g.currentValue, 0);
    const totalInvestments = state.investments.reduce((acc, i) => acc + i.currentValue, 0);
    const totalCrypto = state.cryptos.reduce((acc, c) => acc + (c.amount * c.currentPrice), 0);
    const totalCards = state.cards.reduce((acc, c) => acc + c.currentBill, 0);
    
    const remaining = state.salary - totalExpenses - totalGoals - totalInvestments - totalCrypto - totalCards;

    return {
      salary: state.salary,
      expenses: totalExpenses,
      goals: totalGoals,
      investments: totalInvestments,
      crypto: totalCrypto,
      cards: totalCards,
      remaining
    };
  }, [state]);

  const chartData = [
    { name: 'Gastos', value: stats.expenses, color: '#ef4444' },
    { name: 'Metas', value: stats.goals, color: '#3b82f6' },
    { name: 'Investimentos', value: stats.investments, color: '#10b981' },
    { name: 'Cripto', value: stats.crypto, color: '#f59e0b' },
    { name: 'Cartão', value: stats.cards, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Salário Mensal" 
          value={formatCurrency(stats.salary)} 
          icon={DollarSign} 
          color="emerald"
          onClick={() => {
            const val = prompt('Novo salário mensal:', state.salary.toString());
            if (val) updateState({ salary: parseFloat(val) });
          }}
        />
        <StatCard title="Total Gastos" value={formatCurrency(stats.expenses)} icon={TrendingDown} color="red" />
        <StatCard title="Investimentos" value={formatCurrency(stats.investments + stats.crypto)} icon={TrendingUp} color="blue" />
        <StatCard 
          title="Saldo Restante" 
          value={formatCurrency(stats.remaining)} 
          icon={PieChartIcon} 
          color={stats.remaining >= 0 ? 'emerald' : 'red'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
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

        {/* Quick Actions / Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Divisão Automática</h3>
            <div className="space-y-4">
              <DistributionRow label="Gastos" percent={state.distribution.expenses} color="bg-red-500" />
              <DistributionRow label="Metas" percent={state.distribution.goals} color="bg-blue-500" />
              <DistributionRow label="Investimentos" percent={state.distribution.investments} color="bg-emerald-500" />
              <DistributionRow label="Cripto" percent={state.distribution.crypto} color="bg-amber-500" />
            </div>
            <button 
              onClick={() => alert('Configure as porcentagens na aba de Configurações')}
              className="w-full mt-6 py-2 text-sm font-medium text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
            >
              Ajustar Porcentagens
            </button>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
            <h3 className="text-lg font-bold mb-2">Dica da IA</h3>
            <p className="text-emerald-50 text-sm leading-relaxed">
              Você está economizando {((stats.goals + stats.investments + stats.crypto) / stats.salary * 100 || 0).toFixed(1)}% do seu salário. 
              Excelente progresso! Tente manter acima de 20% para liberdade financeira.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Transações Recentes</h3>
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
                  date: new Date().toISOString()
                };
                updateState({ transactions: [newTransaction, ...state.transactions] });
              }
            }}
            className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {state.transactions.length > 0 ? (
            state.transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>
                    {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={cn(
                  "font-bold",
                  t.type === 'income' ? "text-emerald-500" : "text-red-500"
                )}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">Nenhuma transação registrada.</p>
          )}
        </div>
      </div>
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
        "p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4",
        onClick && "cursor-pointer hover:border-emerald-500 transition-colors"
      )}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color] || colors.emerald)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
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
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
