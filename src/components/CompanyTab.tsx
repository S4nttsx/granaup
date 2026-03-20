import { useState, useMemo } from 'react';
import { AppState, Payable, Receivable, Transaction, Supplier } from '../types';
import ExpensesTab from './ExpensesTab';
import { 
  Building2, 
  Users, 
  Truck, 
  ShoppingBag, 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  X,
  Save,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CompanyTabProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CompanySubTab = 'financeiro' | 'pagar' | 'receber' | 'fornecedores' | 'relatorios';

export default function CompanyTab({ state, updateState }: CompanyTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CompanySubTab>('financeiro');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingPayableId, setEditingPayableId] = useState<string | null>(null);
  const [editingReceivableId, setEditingReceivableId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Forms State
  const [payableForm, setPayableForm] = useState<Partial<Payable>>({
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    supplierId: ''
  });
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '',
    cnpj: '',
    category: '',
    contact: ''
  });
  const [receivableForm, setReceivableForm] = useState<Partial<Receivable>>({
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0]
  });

  const filteredPayables = (state.payables || []).filter(p => 
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceivables = (state.receivables || []).filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const totalToPay = (state.payables || []).filter(p => !p.paid).reduce((acc, p) => acc + p.amount, 0);
    const totalToReceive = (state.receivables || []).filter(r => !r.received).reduce((acc, r) => acc + r.amount, 0);
    
    // Calculate debt per supplier
    const supplierDebts = (state.payables || []).reduce((acc, p) => {
      if (!p.paid) {
        const key = p.supplierId || p.supplierName;
        acc[key] = (acc[key] || 0) + p.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalToPay,
      totalToReceive,
      balance: totalToReceive - totalToPay,
      supplierDebts
    };
  }, [state.payables, state.receivables]);

  const handleAddSupplier = () => {
    if (!supplierForm.name) return;

    let newSuppliers = [...(state.suppliers || [])];
    if (editingSupplierId) {
      newSuppliers = newSuppliers.map(s => 
        s.id === editingSupplierId ? { ...s, ...supplierForm } as Supplier : s
      );
    } else {
      const newSupplier: Supplier = {
        id: Math.random().toString(36).substr(2, 9),
        name: supplierForm.name || '',
        cnpj: supplierForm.cnpj || '',
        category: supplierForm.category || 'Geral',
        contact: supplierForm.contact || ''
      };
      newSuppliers.push(newSupplier);
    }

    updateState({ suppliers: newSuppliers });
    setSupplierForm({ name: '', cnpj: '', category: '', contact: '' });
    setIsAdding(false);
    setEditingSupplierId(null);
  };

  const handleDeleteSupplier = (id: string) => {
    updateState({ suppliers: (state.suppliers || []).filter(s => s.id !== id) });
  };

  const handleEditSupplier = (s: Supplier) => {
    setSupplierForm(s);
    setEditingSupplierId(s.id);
    setIsAdding(true);
  };

  const handleAddPayable = () => {
    if (!payableForm.supplierName || !payableForm.amount) return;
    
    let newPayables = [...state.payables];
    let newTransactions = [...state.transactions];

    const finalSupplierId = payableForm.supplierId === 'manual' ? undefined : payableForm.supplierId;

    if (editingPayableId) {
      newPayables = state.payables.map(p => 
        p.id === editingPayableId 
          ? { ...p, ...payableForm, amount: Number(payableForm.amount), supplierId: finalSupplierId } as Payable
          : p
      );
      
      // Update corresponding transaction
      newTransactions = state.transactions.map(t => 
        t.id === `payable-${editingPayableId}`
          ? {
              ...t,
              description: `[Empresa] ${payableForm.supplierName}: ${payableForm.description}`,
              amount: Number(payableForm.amount),
              date: payableForm.dueDate || new Date().toISOString()
            }
          : t
      );
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const newPayable: Payable = {
        id,
        supplierId: finalSupplierId,
        supplierName: payableForm.supplierName || '',
        amount: Number(payableForm.amount),
        purchaseDate: payableForm.purchaseDate || new Date().toISOString(),
        dueDate: payableForm.dueDate || new Date().toISOString(),
        description: payableForm.description || '',
        paid: false
      };
      newPayables.push(newPayable);

      // Add to transactions as expense
      const newTransaction: Transaction = {
        id: `payable-${id}`,
        description: `[Empresa] ${newPayable.supplierName}: ${newPayable.description}`,
        amount: newPayable.amount,
        type: 'expense',
        category: 'Empresa',
        date: newPayable.dueDate,
        recurrence: 'none'
      };
      newTransactions.push(newTransaction);
    }
    
    updateState({ 
      payables: newPayables,
      transactions: newTransactions
    });
    
    setPayableForm({
      purchaseDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      supplierId: ''
    });
    setIsAdding(false);
    setEditingPayableId(null);
  };

  const handleAddReceivable = () => {
    if (!receivableForm.customerName || !receivableForm.amount) return;

    let newReceivables = [...state.receivables];
    let newTransactions = [...state.transactions];

    if (editingReceivableId) {
      newReceivables = state.receivables.map(r => 
        r.id === editingReceivableId 
          ? { ...r, ...receivableForm, amount: Number(receivableForm.amount) } as Receivable
          : r
      );

      // Update corresponding transaction
      newTransactions = state.transactions.map(t => 
        t.id === `receivable-${editingReceivableId}`
          ? {
              ...t,
              description: `[Empresa] ${receivableForm.customerName}: ${receivableForm.description}`,
              amount: Number(receivableForm.amount),
              date: receivableForm.dueDate || new Date().toISOString()
            }
          : t
      );
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const newReceivable: Receivable = {
        id,
        customerName: receivableForm.customerName,
        amount: Number(receivableForm.amount),
        purchaseDate: receivableForm.purchaseDate || new Date().toISOString(),
        dueDate: receivableForm.dueDate || new Date().toISOString(),
        description: receivableForm.description || '',
        received: false
      };
      newReceivables.push(newReceivable);

      // Add to transactions as income
      const newTransaction: Transaction = {
        id: `receivable-${id}`,
        description: `[Empresa] ${newReceivable.customerName}: ${newReceivable.description}`,
        amount: newReceivable.amount,
        type: 'income',
        category: 'Empresa',
        date: newReceivable.dueDate,
        recurrence: 'none'
      };
      newTransactions.push(newTransaction);
    }

    updateState({ 
      receivables: newReceivables,
      transactions: newTransactions
    });

    setReceivableForm({
      purchaseDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0]
    });
    setIsAdding(false);
    setEditingReceivableId(null);
  };

  const handleDeletePayable = (id: string) => {
    updateState({ 
      payables: state.payables.filter(p => p.id !== id),
      transactions: state.transactions.filter(t => t.id !== `payable-${id}`)
    });
  };

  const handleDeleteReceivable = (id: string) => {
    updateState({ 
      receivables: state.receivables.filter(r => r.id !== id),
      transactions: state.transactions.filter(t => t.id !== `receivable-${id}`)
    });
  };

  const handleEditPayable = (item: Payable) => {
    setPayableForm({
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      amount: item.amount,
      purchaseDate: item.purchaseDate.split('T')[0],
      dueDate: item.dueDate.split('T')[0],
      description: item.description
    });
    setEditingPayableId(item.id);
    setIsAdding(true);
  };

  const handleEditReceivable = (item: Receivable) => {
    setReceivableForm({
      customerName: item.customerName,
      amount: item.amount,
      purchaseDate: item.purchaseDate.split('T')[0],
      dueDate: item.dueDate.split('T')[0],
      description: item.description
    });
    setEditingReceivableId(item.id);
    setIsAdding(true);
  };

  const togglePayableStatus = (id: string) => {
    const updated = state.payables.map(p => p.id === id ? { ...p, paid: !p.paid } : p);
    updateState({ payables: updated });
  };

  const toggleReceivableStatus = (id: string) => {
    const updated = state.receivables.map(r => r.id === id ? { ...r, received: !r.received } : r);
    updateState({ receivables: updated });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-[0.2em]">
            <Building2 className="w-3 h-3" />
            Corporate Suite
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Modo <span className="text-blue-600">Empresa</span>
          </h2>
          <p className="text-sm text-slate-500 max-w-md font-medium leading-relaxed">
            Gestão estratégica de fornecedores, fluxo de caixa e inteligência financeira para o seu negócio.
          </p>
        </div>
        
        <div className="flex bg-slate-100/80 dark:bg-dark-input/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50 dark:border-dark-border/50 overflow-x-auto">
          {[
            { id: 'financeiro', label: 'Fluxo de Caixa', icon: TrendingUp },
            { id: 'pagar', label: 'Contas a Pagar', icon: ArrowDownRight },
            { id: 'receber', label: 'Contas a Receber', icon: ArrowUpRight },
            { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
            { id: 'relatorios', label: 'Insights', icon: ShoppingBag }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as CompanySubTab);
                setIsAdding(false);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
                activeSubTab === tab.id 
                  ? "bg-white dark:bg-dark-card text-blue-600 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-dark-border" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total a Pagar" value={formatCurrency(stats.totalToPay)} icon={ArrowDownRight} color="text-red-500" bg="bg-red-500/10" />
        <StatCard label="Total a Receber" value={formatCurrency(stats.totalToReceive)} icon={ArrowUpRight} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard label="Saldo Projetado" value={formatCurrency(stats.balance)} icon={TrendingUp} color={stats.balance >= 0 ? "text-blue-600" : "text-red-500"} bg="bg-blue-600/10" />
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-dark-card rounded-[2rem] border border-slate-200/60 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Pesquisar registros..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-5 py-3 bg-slate-50 dark:bg-dark-input border border-slate-100 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium"
            />
          </div>
          {activeSubTab !== 'relatorios' && activeSubTab !== 'financeiro' && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] group text-sm"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Adicionar {activeSubTab === 'pagar' ? 'Conta' : activeSubTab === 'receber' ? 'Recebível' : 'Fornecedor'}
            </button>
          )}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeSubTab === 'financeiro' ? (
              <motion.div
                key="financeiro-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExpensesTab 
                  state={state} 
                  updateState={updateState} 
                  categories={[
                    "Salário Funcionário", 
                    "Impostos", 
                    "Transportadora", 
                    "Material de Limpeza", 
                    "Compra de Mercadoria", 
                    "Embalagens", 
                    "Equipamentos", 
                    "Utilitários", 
                    "Brindes"
                  ]} 
                />
              </motion.div>
            ) : isAdding ? (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6 bg-slate-50 dark:bg-dark-input p-6 rounded-3xl border border-slate-200/60 dark:border-dark-border mb-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingPayableId || editingReceivableId || editingSupplierId ? 'Editar Registro' : 'Novo Registro'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsAdding(false);
                      setEditingPayableId(null);
                      setEditingReceivableId(null);
                      setEditingSupplierId(null);
                    }} 
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                {activeSubTab === 'pagar' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Fornecedor</label>
                      <select 
                        value={payableForm.supplierId || ''} 
                        onChange={e => {
                          const s = state.suppliers.find(s => s.id === e.target.value);
                          setPayableForm({
                            ...payableForm, 
                            supplierId: e.target.value,
                            supplierName: s ? s.name : ''
                          });
                        }} 
                        className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium"
                      >
                        <option value="">Selecionar Fornecedor</option>
                        {(state.suppliers || []).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="manual">Outro (Digitar nome)</option>
                      </select>
                    </div>
                    {(!payableForm.supplierId || payableForm.supplierId === 'manual') && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Fornecedor</label>
                        <input type="text" placeholder="Nome da empresa" value={payableForm.supplierName || ''} onChange={e => setPayableForm({...payableForm, supplierName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Valor (R$)</label>
                      <input type="number" placeholder="0,00" value={payableForm.amount || ''} onChange={e => setPayableForm({...payableForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-xl text-red-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Data da Compra</label>
                      <input type="date" value={payableForm.purchaseDate || ''} onChange={e => setPayableForm({...payableForm, purchaseDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Vencimento</label>
                      <input type="date" value={payableForm.dueDate || ''} onChange={e => setPayableForm({...payableForm, dueDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Descrição</label>
                      <input type="text" placeholder="Ex: Compra de insumos para produção" value={payableForm.description || ''} onChange={e => setPayableForm({...payableForm, description: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <button onClick={handleAddPayable} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all md:col-span-2 flex items-center justify-center gap-2.5 active:scale-[0.99] text-sm">
                      <Save className="w-4.5 h-4.5" />
                      {editingPayableId ? 'Atualizar Conta' : 'Salvar Conta'}
                    </button>
                  </div>
                )}
                {activeSubTab === 'receber' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                      <input type="text" placeholder="Nome do cliente ou empresa" value={receivableForm.customerName || ''} onChange={e => setReceivableForm({...receivableForm, customerName: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                      <input type="number" placeholder="0,00" value={receivableForm.amount || ''} onChange={e => setReceivableForm({...receivableForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-bold text-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data da Venda</label>
                      <input type="date" value={receivableForm.purchaseDate || ''} onChange={e => setReceivableForm({...receivableForm, purchaseDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Previsão de Recebimento</label>
                      <input type="date" value={receivableForm.dueDate || ''} onChange={e => setReceivableForm({...receivableForm, dueDate: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                      <input type="text" placeholder="Ex: Venda de produtos finalizados" value={receivableForm.description || ''} onChange={e => setReceivableForm({...receivableForm, description: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <button onClick={handleAddReceivable} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all md:col-span-2 flex items-center justify-center gap-2 text-sm">
                      <Save className="w-4.5 h-4.5" />
                      {editingReceivableId ? 'Atualizar Recebível' : 'Salvar Recebível'}
                    </button>
                  </div>
                )}
                {activeSubTab === 'fornecedores' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nome do Fornecedor</label>
                      <input type="text" placeholder="Nome Fantasia ou Razão Social" value={supplierForm.name || ''} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">CNPJ (Opcional)</label>
                      <input type="text" placeholder="00.000.000/0000-00" value={supplierForm.cnpj || ''} onChange={e => setSupplierForm({...supplierForm, cnpj: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Categoria</label>
                      <input type="text" placeholder="Ex: Logística, Matéria Prima, Serviços" value={supplierForm.category || ''} onChange={e => setSupplierForm({...supplierForm, category: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Contato</label>
                      <input type="text" placeholder="Email, WhatsApp ou Telefone" value={supplierForm.contact || ''} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-sm font-medium" />
                    </div>
                    <button onClick={handleAddSupplier} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all md:col-span-2 flex items-center justify-center gap-2.5 active:scale-[0.99] text-sm">
                      <Save className="w-4.5 h-4.5" />
                      {editingSupplierId ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {activeSubTab === 'pagar' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3 px-6">
                <thead>
                  <tr className="text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                    <th className="px-4 pb-2 font-bold">Vencimento</th>
                    <th className="px-4 pb-2 font-bold">Fornecedor</th>
                    <th className="px-4 pb-2 font-bold">Descrição</th>
                    <th className="px-4 pb-2 font-bold text-right">Valor</th>
                    <th className="px-4 pb-2 font-bold text-center">Status</th>
                    <th className="px-4 pb-2 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayables.map(item => (
                    <tr key={item.id} className={cn("group transition-all", item.paid ? "opacity-60" : "")}>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input rounded-l-2xl border-y border-l border-slate-100 dark:border-dark-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-dark-card rounded-lg shadow-sm flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.supplierName}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border">
                        <span className="text-xs text-slate-500 font-medium line-clamp-1">{item.description}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border text-right">
                        <span className="text-base font-bold text-red-500">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border text-center">
                        <button 
                          onClick={() => togglePayableStatus(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                            item.paid 
                              ? "bg-emerald-500/10 text-emerald-500" 
                              : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          )}
                        >
                          {item.paid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {item.paid ? 'Pago' : 'Pendente'}
                        </button>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input rounded-r-2xl border-y border-r border-slate-100 dark:border-dark-border text-right">
                        <div className="flex items-center justify-end gap-1.5 transition-opacity">
                          <button 
                            onClick={() => handleEditPayable(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-dark-card rounded-lg transition-all shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletePayable(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-dark-card rounded-lg transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPayables.length === 0 && (
                <div className="text-center py-32 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto">
                    <Receipt className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-lg">Nenhuma conta a pagar registrada.</p>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'receber' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3 px-6">
                <thead>
                  <tr className="text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                    <th className="px-4 pb-2 font-bold">Vencimento</th>
                    <th className="px-4 pb-2 font-bold">Cliente</th>
                    <th className="px-4 pb-2 font-bold">Descrição</th>
                    <th className="px-4 pb-2 font-bold text-right">Valor</th>
                    <th className="px-4 pb-2 font-bold text-center">Status</th>
                    <th className="px-4 pb-2 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivables.map(item => (
                    <tr key={item.id} className={cn("group transition-all", item.received ? "opacity-60" : "")}>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input rounded-l-2xl border-y border-l border-slate-100 dark:border-dark-border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-dark-card rounded-lg shadow-sm flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{item.customerName}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border">
                        <span className="text-xs text-slate-500 font-medium line-clamp-1">{item.description}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border text-right">
                        <span className="text-base font-bold text-emerald-500">{formatCurrency(item.amount)}</span>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input border-y border-slate-100 dark:border-dark-border text-center">
                        <button 
                          onClick={() => toggleReceivableStatus(item.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                            item.received 
                              ? "bg-emerald-500/10 text-emerald-500" 
                              : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                          )}
                        >
                          {item.received ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {item.received ? 'Recebido' : 'Pendente'}
                        </button>
                      </td>
                      <td className="px-4 py-4 bg-slate-50 dark:bg-dark-input rounded-r-2xl border-y border-r border-slate-100 dark:border-dark-border text-right">
                        <div className="flex items-center justify-end gap-1.5 transition-opacity">
                          <button 
                            onClick={() => handleEditReceivable(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-dark-card rounded-lg transition-all shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteReceivable(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-dark-card rounded-lg transition-all shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReceivables.length === 0 && (
                <div className="text-center py-20 space-y-3">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-base">Nenhuma conta a receber registrada.</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {(state.suppliers || []).map(supplier => {
              const debt = (state.payables || [])
                .filter(p => (p.supplierId === supplier.id || p.supplierName === supplier.name) && !p.paid)
                .reduce((acc, p) => acc + p.amount, 0);

              return (
                <motion.div 
                  layout
                  key={supplier.id} 
                  className="group p-6 bg-white dark:bg-dark-card rounded-3xl border border-slate-200/60 dark:border-dark-border hover:shadow-xl hover:shadow-blue-600/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-1.5">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{supplier.name}</h4>
                      {supplier.cnpj && (
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          <Building2 className="w-3 h-3" />
                          {supplier.cnpj}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest shadow-md shadow-blue-600/20">{supplier.category}</span>
                  </div>
                  
                  <div className="space-y-5 relative z-10">
                    <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Users className="w-3.5 h-3.5 text-blue-600/50" />
                      {supplier.contact}
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-dark-input rounded-2xl border border-slate-100 dark:border-dark-border">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Dívida em Aberto</p>
                      <p className={cn(
                        "text-2xl font-bold tracking-tighter",
                        debt > 0 ? "text-red-500" : "text-emerald-500"
                      )}>
                        {formatCurrency(debt)}
                      </p>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                      <button 
                        onClick={() => handleEditSupplier(supplier)}
                        className="flex-1 py-3 bg-white dark:bg-dark-input border border-slate-200 dark:border-dark-border rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-3 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm bg-white dark:bg-dark-input border border-slate-200 dark:border-dark-border"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {(state.suppliers || []).length === 0 && (
              <div className="col-span-full text-center py-20 space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-dark-input rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-dark-border">
                  <Truck className="w-10 h-10 text-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum fornecedor</h4>
                  <p className="text-sm text-slate-400 font-medium">Cadastre seus parceiros comerciais para gerenciar dívidas e prazos.</p>
                </div>
              </div>
            )}
          </div>

          {activeSubTab === 'relatorios' && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 dark:bg-dark-input rounded-[2rem] border border-slate-100 dark:border-dark-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700" />
                  <h4 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white relative z-10">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    Balanço Projetado
                  </h4>
                  <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A Receber</span>
                        <p className="text-xs text-slate-500 font-medium">Total pendente de clientes</p>
                      </div>
                      <span className="text-xl font-black text-emerald-500">+{formatCurrency(stats.totalToReceive)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A Pagar</span>
                        <p className="text-xs text-slate-500 font-medium">Total pendente a fornecedores</p>
                      </div>
                      <span className="text-xl font-black text-red-500">-{formatCurrency(stats.totalToPay)}</span>
                    </div>
                    <div className="pt-6 border-t border-slate-200 dark:border-dark-border flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Resultado Operacional</span>
                        <p className="text-[10px] text-slate-400">Projeção líquida para o período</p>
                      </div>
                      <span className={cn("text-3xl font-black tracking-tighter", stats.balance >= 0 ? "text-blue-600" : "text-red-500")}>
                        {formatCurrency(stats.balance)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-blue-600 text-white rounded-[2rem] shadow-xl shadow-blue-600/20 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mb-32 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-2xl font-black mb-3 tracking-tight">Saúde do Fluxo de Caixa</h4>
                    <p className="text-blue-100 text-base leading-relaxed font-medium">
                      Seu saldo projetado é de <span className="font-black text-white underline decoration-blue-400 underline-offset-4">{formatCurrency(stats.balance)}</span>. 
                      {stats.balance > 0 
                        ? " Sua empresa apresenta um fluxo positivo. Momento ideal para investimentos estratégicos." 
                        : " Atenção: Suas obrigações superam as entradas. Revise prazos e reduza custos operacionais."}
                    </p>
                  </div>
                  <div className="pt-8 relative z-10">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] mb-3 text-blue-200">
                      <span>Nível de Comprometimento</span>
                      <span className="text-white">{stats.totalToReceive > 0 ? Math.round((stats.totalToPay / stats.totalToReceive) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-blue-500/30 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, stats.totalToReceive > 0 ? (stats.totalToPay / stats.totalToReceive) * 100 : 0)}%` }}
                        className="h-full bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200/60 dark:border-dark-border shadow-sm hover:shadow-lg hover:border-blue-500/20 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-sm", bg, color)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</span>
        </div>
        <p className={cn("text-2xl font-bold tracking-tighter", color)}>{value}</p>
      </div>
    </div>
  );
}

