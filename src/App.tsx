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
  DollarSign,
  Building2,
  Lightbulb,
  Calculator as CalcIcon,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_STATE } from './constants';
import { AppState, TabType, Goal, Investment, Crypto, CreditCard as Card, Transaction } from './types';

// Components (to be created)
import Dashboard from './components/Dashboard';
import SalaryTab from './components/SalaryTab';
import GoalsTab from './components/GoalsTab';
import InvestmentsTab from './components/InvestmentsTab';
import CryptoTab from './components/CryptoTab';
import CardTab from './components/CardTab';
import SettingsTab from './components/SettingsTab';
import LoginScreen from './components/LoginScreen';
import ExpensesTab from './components/ExpensesTab';
import CompanyTab from './components/CompanyTab';
import NewsTab from './components/NewsTab';
import Calculator from './components/Calculator';
import FutureSimulator from './components/FutureSimulator';
import NotificationCenter from './components/NotificationCenter';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('granaup_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Expose state to NotificationCenter (hacky but works for this structure)
  (window as any).useNotificationOpen = [isNotificationOpen, setIsNotificationOpen];
  (window as any).setNotificationOpen = setIsNotificationOpen;

  useEffect(() => {
    localStorage.setItem('granaup_state', JSON.stringify(state));
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  // Alert System Logic
  useEffect(() => {
    if (!state.user.isLoggedIn) return;

    const newNotifications: any[] = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check Goals
    state.goals.forEach(goal => {
      if (goal.currentValue >= goal.targetValue) {
        const id = `goal-achieved-${goal.id}`;
        if (!state.notifications.find(n => n.id === id)) {
          newNotifications.push({
            id,
            title: 'Meta Alcançada! 🎉',
            message: `Parabéns! Você atingiu sua meta: ${goal.name}`,
            type: 'success',
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    // 2. Check Spending Limits
    const monthlyExpenses = state.transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.type === 'expense' && 
               tDate.getMonth() === now.getMonth() && 
               tDate.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const limit = state.salary * (state.distribution.expenses / 100);
    if (monthlyExpenses > limit) {
      const id = `limit-exceeded-${now.getMonth()}-${now.getFullYear()}`;
      if (!state.notifications.find(n => n.id === id)) {
        newNotifications.push({
          id,
          title: 'Limite de Gastos Ultrapassado! ⚠️',
          message: `Você ultrapassou seu limite mensal de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limit)}`,
          type: 'error',
          date: new Date().toISOString(),
          read: false
        });
      }
    } else if (monthlyExpenses > limit * 0.9) {
      const id = `limit-warning-${now.getMonth()}-${now.getFullYear()}`;
      if (!state.notifications.find(n => n.id === id)) {
        newNotifications.push({
          id,
          title: 'Atenção ao Limite! 🔔',
          message: `Você já utilizou mais de 90% do seu limite de gastos mensal.`,
          type: 'warning',
          date: new Date().toISOString(),
          read: false
        });
      }
    }

    // 3. Check Credit Card Due Dates
    state.cards.forEach(card => {
      const dueDay = parseInt(card.dueDate);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
      
      // If due date passed this month, check next month
      if (dueDate < now) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays >= 0) {
        const id = `card-due-${card.id}-${dueDate.getMonth()}-${dueDate.getFullYear()}`;
        if (!state.notifications.find(n => n.id === id)) {
          newNotifications.push({
            id,
            title: 'Fatura Próxima do Vencimento 💳',
            message: `A fatura do cartão ${card.name} vence em ${diffDays} dias (dia ${card.dueDate}).`,
            type: 'warning',
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    // 4. Check Payables (Contas a Pagar)
    (state.payables || []).forEach(payable => {
      if (payable.paid) return;
      const dueDate = new Date(payable.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays >= 0) {
        const id = `payable-due-${payable.id}`;
        if (!state.notifications.find(n => n.id === id)) {
          newNotifications.push({
            id,
            title: 'Conta a Pagar Próxima do Vencimento 💸',
            message: `A conta para ${payable.supplierName} vence em ${diffDays} dias (${new Date(payable.dueDate).toLocaleDateString('pt-BR')}).`,
            type: 'warning',
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    // 5. Check Receivables (Contas a Receber)
    (state.receivables || []).forEach(receivable => {
      if (receivable.received) return;
      const dueDate = new Date(receivable.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3 && diffDays >= 0) {
        const id = `receivable-due-${receivable.id}`;
        if (!state.notifications.find(n => n.id === id)) {
          newNotifications.push({
            id,
            title: 'Conta a Receber Próxima do Vencimento 💰',
            message: `A conta de ${receivable.customerName} vence em ${diffDays} dias (${new Date(receivable.dueDate).toLocaleDateString('pt-BR')}).`,
            type: 'warning',
            date: new Date().toISOString(),
            read: false
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      updateState({ notifications: [...state.notifications, ...newNotifications] });
    }
  }, [state.goals, state.transactions, state.cards, state.payables, state.receivables, state.salary, state.distribution]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!state.user.isLoggedIn) {
    return <LoginScreen onLogin={(user) => updateState({ user: { ...user, isLoggedIn: true } })} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'salario', label: 'Salário e Despesas', icon: DollarSign },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
    { id: 'cripto', label: 'Cripto', icon: Coins },
    { id: 'cartao', label: 'Cartão', icon: CreditCard },
    { id: 'noticias', label: 'Notícias', icon: Newspaper },
    { id: 'calculadora', label: 'Calculadora', icon: CalcIcon },
    { id: 'simulador', label: 'Simulador de Futuro', icon: Rocket },
    ...(state.isCompanyMode ? [{ id: 'empresa', label: 'Modo Empresa', icon: Building2 }] : []),
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} updateState={updateState} />;
      case 'salario': return <SalaryTab state={state} updateState={updateState} />;
      case 'metas': return <GoalsTab state={state} updateState={updateState} />;
      case 'investimentos': return <InvestmentsTab state={state} updateState={updateState} />;
      case 'cripto': return <CryptoTab state={state} updateState={updateState} />;
      case 'cartao': return <CardTab state={state} updateState={updateState} />;
      case 'empresa': return <CompanyTab state={state} updateState={updateState} />;
      case 'noticias': return <NewsTab state={state} updateState={updateState} />;
      case 'calculadora': return <Calculator state={state} updateState={updateState} />;
      case 'simulador': return <FutureSimulator state={state} updateState={updateState} />;
      case 'config': return <SettingsTab state={state} updateState={updateState} />;
      default: return <Dashboard state={state} updateState={updateState} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-200 transition-colors duration-500 font-sans">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-md"
          />
        )}
      </AnimatePresence>

      {/* Floating Calculator Button */}
      {!state.isCalculatorOpen && (
        <button
          onClick={() => updateState({ isCalculatorOpen: true })}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 z-[999]"
          title="Abrir Calculadora Flutuante"
        >
          <CalcIcon className="w-6 h-6" />
        </button>
      )}

      {/* Pop-up Calculator */}
      <AnimatePresence>
        {state.isCalculatorOpen && (
          <Calculator state={state} updateState={updateState} isPopup />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-card border-r border-slate-200/60 dark:border-dark-border transition-all duration-500 ease-in-out lg:translate-x-0 lg:static",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 dark:border-dark-border/50">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/30 transition-transform group-hover:scale-110 duration-500">
                <Wallet className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white leading-none">Grana<span className="text-blue-600">Up</span></h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Premium Finance</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Menu Principal</p>
              <div className="space-y-0.5">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group text-[11px] font-bold relative",
                      activeTab === item.id 
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                    <span>{item.label}</span>
                    {activeTab === item.id && (
                      <motion.div 
                        layoutId="activeTabIndicator" 
                        className="absolute left-0 w-0.5 h-4 bg-white rounded-full ml-1"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-dark-border/50 space-y-1">
            <button 
              onClick={() => updateState({ darkMode: !state.darkMode })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover transition-all text-[11px] font-bold group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-dark-input flex items-center justify-center group-hover:bg-blue-600/10 transition-colors">
                {state.darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </div>
              <span>{state.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button 
              onClick={() => updateState({ user: { ...state.user, isLoggedIn: false } })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-[11px] font-bold group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                <LogOut className="w-3.5 h-3.5 group-hover:text-white" />
              </div>
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-dark-bg/50">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/60 dark:bg-dark-bg/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-dark-border/50 sticky top-0 z-30">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm hover:bg-slate-50 dark:hover:bg-dark-hover transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Wallet className="text-white w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-900 dark:text-white tracking-tighter">Grana<span className="text-blue-600">Up</span></span>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {menuItems.find(m => m.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter state={state} updateState={updateState} />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-7xl mx-auto"
          >
            {renderTab()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
