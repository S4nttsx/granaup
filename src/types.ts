import { LucideIcon } from 'lucide-react';

export type TabType = 'dashboard' | 'metas' | 'investimentos' | 'cripto' | 'cartao' | 'config' | 'financeiro' | 'empresa' | 'salario' | 'noticias' | 'dicas' | 'calculadora' | 'simulador';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  category: string;
  contact: string;
}

export interface Sale {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  items: string;
}

export interface User {
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  category: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'CDI' | 'Tesouro' | 'Ações' | 'Fundos' | 'Outros';
  investedValue: number;
  currentValue: number;
  yield: number;
}

export interface Crypto {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  investedValue: number;
  currentPrice: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  currentBill: number;
  dueDate: string;
  number?: string;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'transferencia' | 'outro';

export interface Transaction {
  id: string;
  description: string;
  amount: number; // Total amount for installments, or single amount for others
  type: 'expense' | 'income';
  category: string;
  date: string;
  recurrence?: 'none' | 'monthly' | 'yearly';
  parentTransactionId?: string;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  installments?: {
    total: number;
    current: number; // This might be redundant if we calculate based on date, but let's keep it for compatibility or specific overrides
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
}

export interface Payable {
  id: string;
  supplierId?: string;
  supplierName: string;
  amount: number;
  purchaseDate: string;
  dueDate: string;
  description: string;
  paid: boolean;
}

export interface Receivable {
  id: string;
  customerName: string;
  amount: number;
  purchaseDate: string;
  dueDate: string;
  description: string;
  received: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  source: string;
  publishedAt: string;
  category: 'Brasil' | 'Internacional' | 'Combustíveis' | 'Política' | 'Mercado';
  impact?: 'positive' | 'negative' | 'neutral';
  simplifiedSummary?: string;
}

export interface AppState {
  user: User;
  salary: number;
  salaryDate?: string;
  salaryObservation?: string;
  distribution: {
    expenses: number;
    goals: number;
    investments: number;
    crypto: number;
  };
  goals: Goal[];
  investments: Investment[];
  cryptos: Crypto[];
  cards: CreditCard[];
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  payables: Payable[];
  receivables: Receivable[];
  notifications: Notification[];
  darkMode: boolean;
  isCompanyMode: boolean;
  isCalculatorOpen: boolean;
  savedNews: NewsItem[];
}
