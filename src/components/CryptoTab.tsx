import { useState } from 'react';
import { Plus, Coins, Trash2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { AppState, Crypto } from '../types';

interface CryptoTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export default function CryptoTab({ state, updateState }: CryptoTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [invested, setInvested] = useState('');
  const [price, setPrice] = useState('');

  const addCrypto = () => {
    if (!name || !amount || !invested || !price) return;
    const crypto: Crypto = {
      id: Date.now().toString(),
      name,
      symbol: symbol.toUpperCase() || name.substring(0, 3).toUpperCase(),
      amount: parseFloat(amount),
      investedValue: parseFloat(invested),
      currentPrice: parseFloat(price)
    };
    updateState({ cryptos: [...state.cryptos, crypto] });
    setIsAdding(false);
    setName(''); setSymbol(''); setAmount(''); setInvested(''); setPrice('');
  };

  const deleteCrypto = (id: string) => {
    updateState({ cryptos: state.cryptos.filter(c => c.id !== id) });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const totalInvested = state.cryptos.reduce((acc, c) => acc + c.investedValue, 0);
  const totalCurrent = state.cryptos.reduce((acc, c) => acc + (c.amount * c.currentPrice), 0);
  const totalProfit = totalCurrent - totalInvested;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-600 dark:text-white">Criptomoedas</h2>
          <p className="text-slate-500">Acompanhe seus ativos digitais em tempo real.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Adicionar Moeda
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Investimento Cripto</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Valor de Mercado</p>
          <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Lucro/Prejuízo</p>
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
          className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-500/30 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-white">Nova Criptomoeda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome (ex: Bitcoin)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Símbolo (ex: BTC)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Total Investido (R$)"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Preço Atual (R$)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={addCrypto} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">Salvar</button>
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl">Cancelar</button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.cryptos.length > 0 ? (
          state.cryptos.map((crypto) => {
            const currentTotal = crypto.amount * crypto.currentPrice;
            const profit = currentTotal - crypto.investedValue;
            const profitPercent = (profit / crypto.investedValue) * 100;

            return (
              <motion.div 
                key={crypto.id}
                layout
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-bold">
                      {crypto.symbol}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{crypto.name}</h4>
                      <p className="text-sm text-slate-500">{crypto.amount} {crypto.symbol}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteCrypto(crypto.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Valor Atual</span>
                    <span className="font-bold text-amber-500">{formatCurrency(currentTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lucro/Prejuízo</span>
                    <span className={cn("font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Preço Médio: {formatCurrency(crypto.investedValue / crypto.amount)}</span>
                    <button className="text-xs font-bold text-amber-500 hover:underline">Atualizar Preço</button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Coins className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">Nenhuma criptomoeda ainda.</h3>
            <p className="text-slate-500 mb-6">Comece sua jornada no mundo cripto!</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-amber-500 text-white font-bold rounded-2xl"
            >
              Adicionar Primeira Moeda
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
