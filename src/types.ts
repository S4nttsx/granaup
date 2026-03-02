import { LucideIcon } from 'lucide-react';

export type TabType = 'dashboard' | 'metas' | 'investimentos' | 'cripto' | 'cartao' | 'config' | 'despesas';

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

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  date: string;
  recurrence?: 'none' | 'weekly' | 'monthly' | 'yearly';
  parentTransactionId?: string;
  installments?: {
    total: number;
    current: number;
  };
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
  darkMode: boolean;
}
