import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  TrendingUp, 
  Coins, 
  CreditCard, 
  Newspaper, 
  Settings, 
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Plus,
  Wallet,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_STATE } from './constants';
import { AppState, TabType, Goal, Investment, Crypto, CreditCard as Card, Transaction } from './types';

// Components (to be created)
import Dashboard from './components/Dashboard';
import GoalsTab from './components/GoalsTab';
import InvestmentsTab from './components/InvestmentsTab';
import CryptoTab from './components/CryptoTab';
import CardTab from './components/CardTab';
import SettingsTab from './components/SettingsTab';
import LoginScreen from './components/LoginScreen';
import ExpensesTab from './components/ExpensesTab';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('granaup_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('granaup_state', JSON.stringify(state));
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!state.user.isLoggedIn) {
    return <LoginScreen onLogin={(user) => updateState({ user: { ...user, isLoggedIn: true } })} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'despesas', label: 'Salário e Despesas', icon: DollarSign },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'cripto', label: 'Cripto', icon: Coins },
    { id: 'cartao', label: 'Cartão', icon: CreditCard },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} updateState={updateState} />;
      case 'despesas': return <ExpensesTab state={state} updateState={updateState} />;
      case 'metas': return <GoalsTab state={state} updateState={updateState} />;
      case 'investimentos': return <InvestmentsTab state={state} updateState={updateState} />;
      case 'cripto': return <CryptoTab state={state} updateState={updateState} />;
      case 'cartao': return <CardTab state={state} updateState={updateState} />;
      case 'config': return <SettingsTab state={state} updateState={updateState} />;
      default: return <Dashboard state={state} updateState={updateState} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 text-blue-600 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">GranaUp</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  activeTab === item.id 
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:scale-110 transition-transform")} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button 
              onClick={() => updateState({ darkMode: !state.darkMode })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {state.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{state.darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button 
              onClick={() => updateState({ user: { ...state.user, isLoggedIn: false } })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-500 w-6 h-6" />
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">GranaUp</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {renderTab()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
