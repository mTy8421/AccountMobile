export type AccountType =
  | 'CASH'
  | 'BANK'
  | 'WALLET'
  | 'CREDIT_CARD'
  | 'INVESTMENT'
  | 'OTHER';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface AccountData {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  color?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

export interface CategoryData {
  id: string;
  name: string;
  type: string; // INCOME, EXPENSE
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
    budgets: number;
  };
}

export interface TransactionData {
  id: string;
  accountId: string;
  account?: {
    id: string;
    name: string;
    type: string;
    color?: string | null;
  };
  toAccountId?: string | null;
  toAccount?: {
    id: string;
    name: string;
    type: string;
    color?: string | null;
  } | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  } | null;
  type: string; // INCOME, EXPENSE, TRANSFER
  amount: number;
  date: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetData {
  id: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  amount: number;
  month: number;
  year: number;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface RecurringExpenseData {
  id: string;
  name: string;
  amount: number;
  type: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  accountId: string;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  frequency: string;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  lastRunDate?: string | null;
  nextDueDate: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  monthTransactionCount: number;
  accounts: AccountData[];
  categoryExpenses: {
    categoryName: string;
    color: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    income: number;
    expense: number;
    net: number;
  }[];
  recentTransactions: TransactionData[];
}

export interface FilterParams {
  type?: string;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface AppConfigData {
  id: string;
  isPinEnabled: boolean;
  pinHash?: string | null;
  pinSalt?: string | null;
  currency: string;
  theme: string;
  lastBackupAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
