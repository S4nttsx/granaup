import { useState, useMemo } from 'react';
import { Plus, Coins, Trash2, ArrowUpRight, ArrowDownRight, Search, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Crypto, Transaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface CryptoTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function CryptoTab({ state, updateState }: CryptoTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCrypto, setEditingCrypto] = useState<Crypto | null>(null);
  const [contributingCrypto, setContributingCrypto] = useState<Crypto | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [invested, setInvested] = useState('');
  const [price, setPrice] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');

  const resetForm = () => {
    setName('');
    setSymbol('');
    setAmount('');
    setInvested('');
    setPrice('');
    setIsAdding(false);
    setEditingCrypto(null);
  };

  const handleSaveCrypto = () => {
    if (!name || !amount || !invested || !price) return;
    
    if (editingCrypto) {
      const updatedCryptos = state.cryptos.map(c => 
        c.id === editingCrypto.id 
          ? { 
              ...c, 
              name, 
              symbol: symbol.toUpperCase() || name.substring(0, 3).toUpperCase(),
              amount: parseFloat(amount),
              investedValue: parseFloat(invested),
              currentPrice: parseFloat(price)
            } 
          : c
      );
      updateState({ cryptos: updatedCryptos });
    } else {
      const crypto: Crypto = {
        id: Date.now().toString(),
        name,
        symbol: symbol.toUpperCase() || name.substring(0, 3).toUpperCase(),
        amount: parseFloat(amount),
        investedValue: parseFloat(invested),
        currentPrice: parseFloat(price)
      };
      updateState({ cryptos: [...state.cryptos, crypto] });
    }
    resetForm();
  };

  const handleEdit = (crypto: Crypto) => {
    setEditingCrypto(crypto);
    setName(crypto.name);
    setSymbol(crypto.symbol);
    setAmount(crypto.amount.toString());
    setInvested(crypto.investedValue.toString());
    setPrice(crypto.currentPrice.toString());
    setIsAdding(true);
  };

  const deleteCrypto = (id: string) => {
    updateState({ cryptos: state.cryptos.filter(c => c.id !== id) });
  };

  const handleAddMoney = () => {
    if (!contributingCrypto || !contributionAmount) return;

    const brlAmount = parseFloat(contributionAmount);
    if (isNaN(brlAmount) || brlAmount <= 0) return;

    // Calculate how much crypto this buys at current price
    const cryptoAmount = brlAmount / contributingCrypto.currentPrice;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description: `Compra Cripto: ${contributingCrypto.name}`,
      amount: brlAmount,
      type: 'expense',
      category: 'Cripto',
      date: new Date().toISOString(),
      paymentMethod: 'pix'
    };

    updateState({
      cryptos: state.cryptos.map(c => 
        c.id === contributingCrypto.id ? { ...c, amount: c.amount + cryptoAmount, investedValue: c.investedValue + brlAmount } : c
      ),
      transactions: [...state.transactions, newTransaction]
    });

    setContributingCrypto(null);
    setContributionAmount('');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalInvested = state.cryptos.reduce((acc, c) => acc + c.investedValue, 0);
  const totalCurrent = state.cryptos.reduce((acc, c) => acc + (c.amount * c.currentPrice), 0);
  const totalProfit = totalCurrent - totalInvested;

  // Mock historical data for the chart
  const chartData = useMemo(() => {
    if (state.cryptos.length === 0) return [];
    
    const points = 7;
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (points - 1 - i) * 5);
      
      // Interpolate between invested and current with some noise (crypto is more volatile)
      const progress = i / (points - 1);
      const invested = totalInvested;
      const current = totalInvested + (totalCurrent - totalInvested) * progress;
      const noise = (Math.random() - 0.5) * (totalCurrent * 0.1); // 10% noise for crypto
      
      data.push({
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        investido: invested,
        atual: Math.max(invested * 0.7, current + noise)
      });
    }
    return data;
  }, [totalInvested, totalCurrent, state.cryptos.length]);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Minhas <span className="text-amber-500">Criptomoedas</span></h2>
          <p className="text-slate-500 font-medium">Acompanhe seus ativos digitais em tempo real.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-2xl shadow-amber-500/30 hover:bg-amber-600 transition-all active:scale-95 group"
        >
          <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          Adicionar Moeda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... existing cards ... */}
      </div>

      {/* Evolution Chart */}
      {state.cryptos.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Evolução Cripto</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Desempenho dos últimos 30 dias (Simulado)</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-dark-border" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
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
                  stroke="#f59e0b" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCrypto)" 
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
          className="p-10 bg-white dark:bg-dark-card rounded-[2.5rem] border border-amber-500/20 shadow-2xl shadow-amber-600/5 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingCrypto ? 'Editar Criptomoeda' : 'Nova Criptomoeda'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Moeda</label>
              <input
                type="text"
                placeholder="Ex: Bitcoin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Símbolo</label>
              <input
                type="text"
                placeholder="Ex: BTC"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
              <input
                type="number"
                placeholder="0.000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total Investido (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={invested}
                onChange={(e) => setInvested(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preço Atual (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-2xl outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleSaveCrypto}
              className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-600/20 hover:bg-amber-600 transition-all"
            >
              {editingCrypto ? 'Atualizar' : 'Salvar'}
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

      {contributingCrypto && (
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
              <div className="w-20 h-20 bg-amber-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Coins className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Investir em {contributingCrypto.name}</h3>
              <p className="text-slate-500 font-medium">Informe o valor em Reais (R$). O sistema calculará a quantidade de moedas.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Valor do Investimento</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">R$</span>
                  <input
                    autoFocus
                    type="number"
                    placeholder="0,00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-dark-input border-2 border-slate-100 dark:border-dark-border rounded-[2rem] outline-none focus:border-amber-600 text-4xl font-black tracking-tighter transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleAddMoney}
                  className="w-full py-5 bg-amber-500 text-white font-bold rounded-2xl shadow-2xl shadow-amber-600/30 hover:bg-amber-600 transition-all active:scale-95"
                >
                  Confirmar Compra
                </button>
                <button 
                  onClick={() => setContributingCrypto(null)}
                  className="w-full py-5 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.cryptos.length > 0 ? (
          state.cryptos.map((crypto) => {
            const currentTotal = crypto.amount * crypto.currentPrice;
            const profit = currentTotal - crypto.investedValue;
            const profitPercent = (profit / crypto.investedValue) * 100;

            return (
              <motion.div 
                key={crypto.id}
                layout
                className="p-10 bg-white dark:bg-dark-card rounded-[2.5rem] border border-slate-200/60 dark:border-dark-border shadow-sm hover:shadow-2xl hover:shadow-amber-600/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform font-black text-xl">
                      {crypto.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{crypto.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{crypto.amount.toFixed(6)} {crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 transition-opacity">
                    <button 
                      onClick={() => setContributingCrypto(crypto)}
                      className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                      title="Comprar mais"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleEdit(crypto)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteCrypto(crypto.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Atual</p>
                      <p className="text-2xl font-black text-amber-500 tracking-tighter">{formatCurrency(currentTotal)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro/Prejuízo</p>
                      <p className={cn("text-2xl font-black tracking-tighter", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-dark-input rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro em Reais</span>
                      <span className={cn("text-sm font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {formatCurrency(profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Médio</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {formatCurrency(crypto.investedValue / crypto.amount)}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-slate-100 dark:bg-dark-hover text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                    Atualizar Cotação
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center bg-white dark:bg-dark-card rounded-[3rem] border border-dashed border-slate-200 dark:border-dark-border space-y-8">
            <div className="w-24 h-24 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-dark-border">
              <Coins className="w-12 h-12 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nenhuma criptomoeda ainda.</h3>
              <p className="text-slate-500 font-medium">Comece sua jornada no mundo cripto!</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-10 py-5 bg-amber-500 text-white font-bold rounded-2xl shadow-2xl shadow-amber-600/30 hover:bg-amber-600 transition-all"
            >
              Adicionar Minha Primeira Moeda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
