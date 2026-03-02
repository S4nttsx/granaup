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
  darkMode: false,
};

export const CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Contas',
  'Outros',
];
