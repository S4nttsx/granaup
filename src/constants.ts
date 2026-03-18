import { AppState } from './types';

export const INITIAL_STATE: AppState = {
  user: {
    name: '',
    email: '',
    isLoggedIn: false,
  },
  salary: 0,
  distribution: {
    expenses: 50,
    goals: 20,
    investments: 20,
    crypto: 10,
  },
  goals: [],
  investments: [],
  cryptos: [],
  cards: [],
  transactions: [],
  customers: [],
  suppliers: [],
  sales: [],
  payables: [],
  receivables: [],
  notifications: [],
  darkMode: false,
  isCompanyMode: false,
};

export const CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Contas',
  'Investimento',
  'Meta',
  'Cripto',
  'Salário',
  'Freelance',
  'Venda',
  'Presente',
  'Outros',
];
