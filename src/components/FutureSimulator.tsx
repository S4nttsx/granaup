import { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Percent, 
  Info,
  ArrowRight,
  Zap,
  Target,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppState } from '../types';

interface FutureSimulatorProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function FutureSimulator({ state, updateState }: FutureSimulatorProps) {
  const [salary, setSalary] = useState(String(state.salary || ''));
  const [monthlySavings, setMonthlySavings] = useState('');
  const [annualReturn, setAnnualReturn] = useState('10'); // Default 10% (SELIC/CDI)
  const [years, setYears] = useState(5);

  const projectionData = useMemo(() => {
    const data = [];
    let balance = 0;
    const returnNum = Number(annualReturn) || 0;
    const savingsNum = Number(monthlySavings) || 0;
    const monthlyRate = Math.pow(1 + returnNum / 100, 1 / 12) - 1;

    for (let month = 0; month <= years * 12; month++) {
      if (month > 0) {
        balance = (balance + savingsNum) * (1 + monthlyRate);
      }
      
      if (month % 12 === 0) {
        data.push({
          year: month / 12,
          balance: Math.round(balance),
          invested: savingsNum * month
        });
      }
    }
    return data;
  }, [monthlySavings, annualReturn, years]);

  const finalBalance = projectionData[projectionData.length - 1]?.balance || 0;
  const savingsNum = Number(monthlySavings) || 0;
  const salaryNum = Number(salary) || 0;
  const totalInvested = savingsNum * years * 12;
  const totalInterest = finalBalance - totalInvested;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Rocket className="text-white w-6 h-6" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Simulador de <span className="text-emerald-500">Futuro Financeiro</span>
          </h2>
        </div>
        <p className="text-slate-500 font-medium ml-1">Descubra quanto você terá no futuro com base nas suas economias hoje.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-dark-border shadow-sm space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Salário Atual</span>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-dark-hover border-none rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="0,00"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quanto guardar por mês?</span>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <input
                    type="number"
                    value={monthlySavings}
                    onChange={(e) => setMonthlySavings(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-dark-hover border-none rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 ml-1">
                  {salaryNum > 0 ? `${((savingsNum / salaryNum) * 100).toFixed(1)}% do seu salário` : 'Defina seu salário para ver a porcentagem'}
                </p>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentabilidade Anual Estimada (%)</span>
                <div className="relative mt-2">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Percent className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="number"
                    value={annualReturn}
                    onChange={(e) => setAnnualReturn(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-dark-hover border-none rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo (Anos)</span>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 5, 10, 20].map((y) => (
                    <button
                      key={y}
                      onClick={() => setYears(y)}
                      className={`py-3 rounded-xl font-black text-xs transition-all ${
                        years === y 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-slate-100 dark:bg-dark-hover text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {y}y
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-blue-600/20">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 opacity-80" />
              <p className="text-xs font-black uppercase tracking-widest">Dica de Especialista</p>
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Guardar <span className="font-black underline">20%</span> do seu salário é a regra de ouro. 
              Com seu salário atual, isso seria <span className="font-black">{formatCurrency(salaryNum * 0.2)}</span> por mês.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Result Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-card p-10 rounded-[3rem] border border-slate-200 dark:border-dark-border shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Target className="w-40 h-40" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Em {years} anos você terá:</p>
                <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {formatCurrency(finalBalance)}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-dark-hover rounded-3xl border border-slate-100 dark:border-dark-border">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Investido</p>
                  <p className="text-xl font-black text-slate-700 dark:text-slate-200">{formatCurrency(totalInvested)}</p>
                </div>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Rendimento em Juros</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalInterest)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chart */}
          <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border border-slate-200 dark:border-dark-border shadow-sm h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Evolução do Patrimônio</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-dark-border" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Investido</span>
                </div>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    label={{ value: 'Anos', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#1e293b',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Ano ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="invested" 
                    stroke="#e2e8f0" 
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
