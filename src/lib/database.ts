import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { initialData } from '@/data/initialData';
import {
  AccountData,
  CategoryData,
  TransactionData,
  BudgetData,
  RecurringExpenseData,
  DashboardStats,
  FilterParams,
  AppConfigData,
} from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('expense_tracker.db');
  dbInstance = db;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      initialBalance REAL NOT NULL DEFAULT 0,
      currentBalance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'THB',
      color TEXT DEFAULT '#3b82f6',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'Tag',
      color TEXT NOT NULL DEFAULT '#64748b',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      toAccountId TEXT,
      categoryId TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE,
      FOREIGN KEY (toAccountId) REFERENCES accounts (id) ON DELETE SET NULL,
      FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE,
      UNIQUE(categoryId, month, year)
    );

    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'EXPENSE',
      categoryId TEXT NOT NULL,
      accountId TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'MONTHLY',
      dayOfMonth INTEGER DEFAULT 1,
      dayOfWeek INTEGER,
      lastRunDate TEXT,
      nextDueDate TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE,
      FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_config (
      id TEXT PRIMARY KEY DEFAULT 'default',
      isPinEnabled INTEGER NOT NULL DEFAULT 0,
      pinHash TEXT,
      pinSalt TEXT,
      currency TEXT NOT NULL DEFAULT 'THB',
      theme TEXT NOT NULL DEFAULT 'system',
      lastBackupAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Check if initial seeding is needed
  const accountCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts'
  );

  if (!accountCount || accountCount.count === 0) {
    await seedDatabase(db);
  }

  return db;
}

export async function seedDatabase(db?: SQLite.SQLiteDatabase): Promise<void> {
  const database = db || (await getDatabase());

  await database.execAsync(`
    DELETE FROM transactions;
    DELETE FROM recurring_expenses;
    DELETE FROM budgets;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM app_config;
  `);

  // 1. Config
  const cfg = initialData.config || {
    id: 'default',
    isPinEnabled: false,
    pinHash: null,
    pinSalt: null,
    currency: 'THB',
    theme: 'system',
    lastBackupAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await database.runAsync(
    `INSERT INTO app_config (id, isPinEnabled, pinHash, pinSalt, currency, theme, lastBackupAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cfg.id || 'default',
      cfg.isPinEnabled ? 1 : 0,
      cfg.pinHash || null,
      cfg.pinSalt || null,
      cfg.currency || 'THB',
      cfg.theme || 'system',
      cfg.lastBackupAt || null,
      cfg.createdAt || new Date().toISOString(),
      cfg.updatedAt || new Date().toISOString(),
    ]
  );

  // 2. Accounts
  for (const acc of initialData.accounts) {
    await database.runAsync(
      `INSERT INTO accounts (id, name, type, initialBalance, currentBalance, currency, color, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acc.id,
        acc.name,
        acc.type,
        acc.initialBalance,
        acc.currentBalance,
        acc.currency || 'THB',
        acc.color || '#3b82f6',
        acc.isActive ? 1 : 0,
        acc.createdAt,
        acc.updatedAt,
      ]
    );
  }

  // 3. Categories
  for (const cat of initialData.categories) {
    await database.runAsync(
      `INSERT INTO categories (id, name, type, icon, color, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cat.id,
        cat.name,
        cat.type,
        cat.icon,
        cat.color,
        cat.isActive ? 1 : 0,
        cat.createdAt,
        cat.updatedAt,
      ]
    );
  }

  // 4. Budgets
  for (const b of initialData.budgets) {
    await database.runAsync(
      `INSERT INTO budgets (id, categoryId, amount, month, year, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [b.id, b.categoryId, b.amount, b.month, b.year, b.createdAt, b.updatedAt]
    );
  }

  // 5. Recurring
  for (const r of initialData.recurring) {
    await database.runAsync(
      `INSERT INTO recurring_expenses (id, name, amount, type, categoryId, accountId, frequency, dayOfMonth, dayOfWeek, lastRunDate, nextDueDate, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.name,
        r.amount,
        r.type,
        r.categoryId,
        r.accountId,
        r.frequency,
        r.dayOfMonth ?? 1,
        r.dayOfWeek ?? null,
        r.lastRunDate ?? null,
        r.nextDueDate,
        r.isActive ? 1 : 0,
        r.createdAt,
        r.updatedAt,
      ]
    );
  }

  // 6. Transactions
  for (const t of initialData.transactions) {
    await database.runAsync(
      `INSERT INTO transactions (id, accountId, toAccountId, categoryId, type, amount, date, note, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.accountId,
        t.toAccountId ?? null,
        t.categoryId ?? null,
        t.type,
        t.amount,
        t.date,
        t.note ?? null,
        t.createdAt,
        t.updatedAt,
      ]
    );
  }

  // Reconcile all balances
  await reconcileAllAccounts(database);
}

// ----------------------------------------------------
// BALANCE RECONCILIATION
// ----------------------------------------------------
export async function recalculateAccountBalance(
  accountId: string,
  db?: SQLite.SQLiteDatabase
): Promise<number> {
  const database = db || (await getDatabase());

  const account = await database.getFirstAsync<{ initialBalance: number }>(
    'SELECT initialBalance FROM accounts WHERE id = ?',
    [accountId]
  );
  if (!account) return 0;

  const incomeRow = await database.getFirstAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE accountId = ? AND type = 'INCOME'",
    [accountId]
  );
  const expenseRow = await database.getFirstAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE accountId = ? AND type = 'EXPENSE'",
    [accountId]
  );
  const transferOutRow = await database.getFirstAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE accountId = ? AND type = 'TRANSFER'",
    [accountId]
  );
  const transferInRow = await database.getFirstAsync<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE toAccountId = ? AND type = 'TRANSFER'",
    [accountId]
  );

  const income = incomeRow?.total || 0;
  const expense = expenseRow?.total || 0;
  const transferOut = transferOutRow?.total || 0;
  const transferIn = transferInRow?.total || 0;

  const newBalance =
    account.initialBalance + income - expense - transferOut + transferIn;
  const rounded = Math.round(newBalance * 100) / 100;

  await database.runAsync(
    'UPDATE accounts SET currentBalance = ?, updatedAt = ? WHERE id = ?',
    [rounded, new Date().toISOString(), accountId]
  );

  return rounded;
}

export async function reconcileAllAccounts(
  db?: SQLite.SQLiteDatabase
): Promise<void> {
  const database = db || (await getDatabase());
  const accounts = await database.getAllAsync<{ id: string }>(
    'SELECT id FROM accounts'
  );
  for (const acc of accounts) {
    await recalculateAccountBalance(acc.id, database);
  }
}

// ----------------------------------------------------
// ACCOUNTS
// ----------------------------------------------------
export async function getAccounts(): Promise<AccountData[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM accounts WHERE isActive = 1 ORDER BY createdAt ASC'
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    initialBalance: r.initialBalance,
    currentBalance: r.currentBalance,
    currency: r.currency,
    color: r.color,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createAccount(data: {
  name: string;
  type: string;
  initialBalance: number;
  color?: string;
}): Promise<AccountData> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const balance = Number(data.initialBalance) || 0;

  await db.runAsync(
    `INSERT INTO accounts (id, name, type, initialBalance, currentBalance, currency, color, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'THB', ?, 1, ?, ?)`,
    [id, data.name, data.type, balance, balance, data.color || '#3b82f6', now, now]
  );

  await recalculateAccountBalance(id);
  const created = await db.getFirstAsync<any>(
    'SELECT * FROM accounts WHERE id = ?',
    [id]
  );
  return created;
}

export async function updateAccount(
  id: string,
  data: {
    name: string;
    type: string;
    initialBalance: number;
    color?: string;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE accounts SET name = ?, type = ?, initialBalance = ?, color = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.name,
      data.type,
      Number(data.initialBalance) || 0,
      data.color || '#3b82f6',
      now,
      id,
    ]
  );

  await recalculateAccountBalance(id);
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE accountId = ? OR toAccountId = ?', [id, id]);
  await db.runAsync('DELETE FROM recurring_expenses WHERE accountId = ?', [id]);
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
}

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------
export async function getCategories(): Promise<CategoryData[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM categories WHERE isActive = 1 ORDER BY type ASC, name ASC'
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    icon: r.icon,
    color: r.color,
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createCategory(data: {
  name: string;
  type: string;
  icon: string;
  color: string;
}): Promise<CategoryData> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO categories (id, name, type, icon, color, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, data.name, data.type, data.icon, data.color, now, now]
  );

  const created = await db.getFirstAsync<any>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  return created;
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    type: string;
    icon: string;
    color: string;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, updatedAt = ?
     WHERE id = ?`,
    [data.name, data.type, data.icon, data.color, now, id]
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE transactions SET categoryId = NULL WHERE categoryId = ?', [id]);
  await db.runAsync('DELETE FROM budgets WHERE categoryId = ?', [id]);
  await db.runAsync('DELETE FROM recurring_expenses WHERE categoryId = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

// ----------------------------------------------------
// TRANSACTIONS
// ----------------------------------------------------
export async function getTransactions(filters: FilterParams = {}): Promise<{
  transactions: TransactionData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> {
  const db = await getDatabase();
  const {
    type,
    accountId,
    categoryId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  const conditions: string[] = [];
  const params: any[] = [];

  if (type && type !== 'ALL') {
    conditions.push('t.type = ?');
    params.push(type);
  }

  if (accountId && accountId !== 'ALL') {
    conditions.push('(t.accountId = ? OR t.toAccountId = ?)');
    params.push(accountId, accountId);
  }

  if (categoryId && categoryId !== 'ALL') {
    conditions.push('t.categoryId = ?');
    params.push(categoryId);
  }

  if (startDate) {
    conditions.push('t.date >= ?');
    params.push(`${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    conditions.push('t.date <= ?');
    params.push(`${endDate}T23:59:59.999Z`);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      '(t.note LIKE ? OR c.name LIKE ? OR a.name LIKE ? OR ta.name LIKE ?)'
    );
    params.push(term, term, term, term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM transactions t
     LEFT JOIN accounts a ON t.accountId = a.id
     LEFT JOIN accounts ta ON t.toAccountId = ta.id
     LEFT JOIN categories c ON t.categoryId = c.id
     ${whereClause}`,
    params
  );
  const totalCount = countRow?.count || 0;

  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const orderColumn = sortBy === 'amount' ? 't.amount' : 't.date';
  const offset = (page - 1) * limit;

  const queryParams = [...params, limit, offset];
  const rows = await db.getAllAsync<any>(
    `SELECT
       t.*,
       a.name as accountName, a.type as accountType, a.color as accountColor,
       ta.name as toAccountName, ta.type as toAccountType, ta.color as toAccountColor,
       c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor, c.type as categoryType
     FROM transactions t
     LEFT JOIN accounts a ON t.accountId = a.id
     LEFT JOIN accounts ta ON t.toAccountId = ta.id
     LEFT JOIN categories c ON t.categoryId = c.id
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT ? OFFSET ?`,
    queryParams
  );

  const transactions: TransactionData[] = rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    account: {
      id: r.accountId,
      name: r.accountName || 'Unknown',
      type: r.accountType || 'OTHER',
      color: r.accountColor,
    },
    toAccountId: r.toAccountId,
    toAccount: r.toAccountId
      ? {
          id: r.toAccountId,
          name: r.toAccountName || 'Unknown',
          type: r.toAccountType || 'OTHER',
          color: r.toAccountColor,
        }
      : null,
    categoryId: r.categoryId,
    category: r.categoryId
      ? {
          id: r.categoryId,
          name: r.categoryName || 'Unknown',
          icon: r.categoryIcon || 'Tag',
          color: r.categoryColor || '#64748b',
          type: r.categoryType || 'EXPENSE',
        }
      : null,
    type: r.type,
    amount: r.amount,
    date: r.date,
    note: r.note,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return {
    transactions,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
  };
}

export async function createTransaction(data: {
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  date: string;
  note?: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  // Normalize date format
  const dateStr = data.date.includes('T')
    ? data.date
    : new Date(`${data.date}T12:00:00.000Z`).toISOString();

  await db.runAsync(
    `INSERT INTO transactions (id, accountId, toAccountId, categoryId, type, amount, date, note, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.accountId,
      data.type === 'TRANSFER' ? data.toAccountId ?? null : null,
      data.type === 'TRANSFER' ? null : data.categoryId ?? null,
      data.type,
      Number(data.amount),
      dateStr,
      data.note || null,
      now,
      now,
    ]
  );

  await recalculateAccountBalance(data.accountId);
  if (data.type === 'TRANSFER' && data.toAccountId) {
    await recalculateAccountBalance(data.toAccountId);
  }
}

export async function updateTransaction(
  id: string,
  data: {
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    date: string;
    note?: string | null;
  }
): Promise<void> {
  const db = await getDatabase();
  const oldTx = await db.getFirstAsync<any>(
    'SELECT * FROM transactions WHERE id = ?',
    [id]
  );
  if (!oldTx) throw new Error('ไม่พบรายการที่ระบุ');

  const now = new Date().toISOString();
  const dateStr = data.date.includes('T')
    ? data.date
    : new Date(`${data.date}T12:00:00.000Z`).toISOString();

  await db.runAsync(
    `UPDATE transactions
     SET accountId = ?, toAccountId = ?, categoryId = ?, type = ?, amount = ?, date = ?, note = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.accountId,
      data.type === 'TRANSFER' ? data.toAccountId ?? null : null,
      data.type === 'TRANSFER' ? null : data.categoryId ?? null,
      data.type,
      Number(data.amount),
      dateStr,
      data.note || null,
      now,
      id,
    ]
  );

  const affectedAccounts = new Set<string>([
    oldTx.accountId,
    data.accountId,
  ]);
  if (oldTx.toAccountId) affectedAccounts.add(oldTx.toAccountId);
  if (data.toAccountId) affectedAccounts.add(data.toAccountId);

  for (const accId of affectedAccounts) {
    await recalculateAccountBalance(accId);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  const tx = await db.getFirstAsync<any>(
    'SELECT * FROM transactions WHERE id = ?',
    [id]
  );
  if (!tx) return;

  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);

  await recalculateAccountBalance(tx.accountId);
  if (tx.toAccountId) {
    await recalculateAccountBalance(tx.toAccountId);
  }
}

// ----------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDatabase();
  const accounts = await getAccounts();
  const totalBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  // Current Month Income
  const incomeRow = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT SUM(amount) as total, COUNT(*) as count
     FROM transactions
     WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
    [startOfMonth, endOfMonth]
  );
  const monthIncome = incomeRow?.total || 0;

  // Current Month Expense
  const expenseRow = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT SUM(amount) as total, COUNT(*) as count
     FROM transactions
     WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
    [startOfMonth, endOfMonth]
  );
  const monthExpense = expenseRow?.total || 0;

  // Month Transaction Count
  const totalCountRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions WHERE date >= ? AND date <= ?`,
    [startOfMonth, endOfMonth]
  );
  const monthTransactionCount = totalCountRow?.count || 0;

  // Category Expenses for current month
  const categoryExpensesRows = await db.getAllAsync<any>(
    `SELECT
       c.name as categoryName,
       c.color,
       c.icon,
       SUM(t.amount) as amount
     FROM transactions t
     JOIN categories c ON t.categoryId = c.id
     WHERE t.type = 'EXPENSE' AND t.date >= ? AND t.date <= ?
     GROUP BY c.id
     ORDER BY amount DESC`,
    [startOfMonth, endOfMonth]
  );

  const categoryExpenses = categoryExpensesRows.map((row) => ({
    categoryName: row.categoryName,
    color: row.color || '#64748b',
    icon: row.icon || 'Tag',
    amount: row.amount,
    percentage: monthExpense > 0 ? Math.round((row.amount / monthExpense) * 100) : 0,
  }));

  // Monthly trend: last 6 months
  const monthlyTrend: { month: string; income: number; expense: number; net: number }[] = [];
  const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const inc = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
      [start, end]
    );
    const exp = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
      [start, end]
    );

    const iVal = inc?.total || 0;
    const eVal = exp?.total || 0;
    monthlyTrend.push({
      month: `${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
      income: iVal,
      expense: eVal,
      net: iVal - eVal,
    });
  }

  // Recent 5 transactions
  const { transactions: recentTransactions } = await getTransactions({
    limit: 5,
    page: 1,
  });

  return {
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    monthTransactionCount,
    accounts,
    categoryExpenses,
    monthlyTrend,
    recentTransactions,
  };
}

// ----------------------------------------------------
// BUDGETS
// ----------------------------------------------------
export async function getBudgets(month: number, year: number): Promise<BudgetData[]> {
  const db = await getDatabase();
  const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const rows = await db.getAllAsync<any>(
    `SELECT
       b.*,
       c.name as categoryName,
       c.icon as categoryIcon,
       c.color as categoryColor,
       (
         SELECT COALESCE(SUM(t.amount), 0)
         FROM transactions t
         WHERE t.categoryId = b.categoryId
           AND t.type = 'EXPENSE'
           AND t.date >= ? AND t.date <= ?
       ) as spent
     FROM budgets b
     JOIN categories c ON b.categoryId = c.id
     WHERE b.month = ? AND b.year = ?
     ORDER BY b.amount DESC`,
    [startOfMonth, endOfMonth, month, year]
  );

  return rows.map((r) => {
    const spent = r.spent || 0;
    const remaining = Math.max(0, r.amount - spent);
    const percentage = r.amount > 0 ? Math.round((spent / r.amount) * 100) : 0;

    return {
      id: r.id,
      categoryId: r.categoryId,
      category: {
        id: r.categoryId,
        name: r.categoryName,
        icon: r.categoryIcon,
        color: r.categoryColor,
      },
      amount: r.amount,
      month: r.month,
      year: r.year,
      spent,
      remaining,
      percentage,
    };
  });
}

export async function setBudget(data: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<any>(
    'SELECT id FROM budgets WHERE categoryId = ? AND month = ? AND year = ?',
    [data.categoryId, data.month, data.year]
  );

  if (existing) {
    await db.runAsync(
      'UPDATE budgets SET amount = ?, updatedAt = ? WHERE id = ?',
      [Number(data.amount), now, existing.id]
    );
  } else {
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO budgets (id, categoryId, amount, month, year, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.categoryId, Number(data.amount), data.month, data.year, now, now]
    );
  }
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

// ----------------------------------------------------
// RECURRING EXPENSES
// ----------------------------------------------------
export async function getRecurringExpenses(): Promise<RecurringExpenseData[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT
       r.*,
       c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
       a.name as accountName, a.type as accountType
     FROM recurring_expenses r
     JOIN categories c ON r.categoryId = c.id
     JOIN accounts a ON r.accountId = a.id
     ORDER BY r.nextDueDate ASC`
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    type: r.type,
    categoryId: r.categoryId,
    category: {
      id: r.categoryId,
      name: r.categoryName,
      icon: r.categoryIcon,
      color: r.categoryColor,
    },
    accountId: r.accountId,
    account: {
      id: r.accountId,
      name: r.accountName,
      type: r.accountType,
    },
    frequency: r.frequency,
    dayOfMonth: r.dayOfMonth,
    dayOfWeek: r.dayOfWeek,
    lastRunDate: r.lastRunDate,
    nextDueDate: r.nextDueDate,
    isActive: Boolean(r.isActive),
  }));
}

export async function createRecurringExpense(data: {
  name: string;
  amount: number;
  type: string;
  categoryId: string;
  accountId: string;
  frequency: string;
  dayOfMonth?: number;
  nextDueDate: string;
}): Promise<void> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();
  const due = data.nextDueDate.includes('T')
    ? data.nextDueDate
    : new Date(`${data.nextDueDate}T00:00:00.000Z`).toISOString();

  await db.runAsync(
    `INSERT INTO recurring_expenses (id, name, amount, type, categoryId, accountId, frequency, dayOfMonth, nextDueDate, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.name,
      Number(data.amount),
      data.type || 'EXPENSE',
      data.categoryId,
      data.accountId,
      data.frequency || 'MONTHLY',
      data.dayOfMonth ?? 1,
      due,
      now,
      now,
    ]
  );
}

export async function updateRecurringExpense(
  id: string,
  data: {
    name: string;
    amount: number;
    type: string;
    categoryId: string;
    accountId: string;
    frequency: string;
    dayOfMonth?: number;
    nextDueDate: string;
    isActive?: boolean;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const due = data.nextDueDate.includes('T')
    ? data.nextDueDate
    : new Date(`${data.nextDueDate}T00:00:00.000Z`).toISOString();

  await db.runAsync(
    `UPDATE recurring_expenses
     SET name = ?, amount = ?, type = ?, categoryId = ?, accountId = ?, frequency = ?, dayOfMonth = ?, nextDueDate = ?, isActive = ?, updatedAt = ?
     WHERE id = ?`,
    [
      data.name,
      Number(data.amount),
      data.type || 'EXPENSE',
      data.categoryId,
      data.accountId,
      data.frequency || 'MONTHLY',
      data.dayOfMonth ?? 1,
      due,
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
      now,
      id,
    ]
  );
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recurring_expenses WHERE id = ?', [id]);
}

export async function processRecurringExpense(id: string): Promise<void> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<any>(
    'SELECT * FROM recurring_expenses WHERE id = ?',
    [id]
  );
  if (!r) throw new Error('ไม่พบรายการค่าใช้จ่ายประจำ');

  const now = new Date();
  const nowIso = now.toISOString();

  // Create immediate transaction
  await createTransaction({
    accountId: r.accountId,
    categoryId: r.categoryId,
    type: r.type as any,
    amount: r.amount,
    date: nowIso,
    note: `[อัตโนมัติ] ${r.name}`,
  });

  // Calculate next due date
  const currentDue = new Date(r.nextDueDate);
  let nextDue = new Date(currentDue);
  switch (r.frequency) {
    case 'DAILY':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'WEEKLY':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'MONTHLY':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'YEARLY':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
    default:
      nextDue.setMonth(nextDue.getMonth() + 1);
  }

  await db.runAsync(
    `UPDATE recurring_expenses SET lastRunDate = ?, nextDueDate = ?, updatedAt = ? WHERE id = ?`,
    [nowIso, nextDue.toISOString(), nowIso, id]
  );
}

// ----------------------------------------------------
// REPORTS
// ----------------------------------------------------
export async function getReportsData(
  mode: 'monthly' | 'yearly',
  month: number,
  year: number
): Promise<{
  totalIncome: number;
  totalExpense: number;
  net: number;
  categoryExpenses: { name: string; amount: number; percentage: number; color: string; icon: string }[];
  dailyExpenses?: { day: number; dateStr: string; amount: number }[];
  monthlyBreakdown?: { monthName: string; income: number; expense: number; net: number }[];
}> {
  const db = await getDatabase();
  const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  if (mode === 'monthly') {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

    const incRow = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
      [start, end]
    );
    const expRow = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
      [start, end]
    );
    const totalIncome = incRow?.total || 0;
    const totalExpense = expRow?.total || 0;

    const catRows = await db.getAllAsync<any>(
      `SELECT c.name, c.color, c.icon, SUM(t.amount) as amount
       FROM transactions t
       JOIN categories c ON t.categoryId = c.id
       WHERE t.type = 'EXPENSE' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id
       ORDER BY amount DESC`,
      [start, end]
    );

    const categoryExpenses = catRows.map((c) => ({
      name: c.name,
      amount: c.amount,
      color: c.color || '#64748b',
      icon: c.icon || 'Tag',
      percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    }));

    // Daily breakdown for this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyExpenses: { day: number; dateStr: string; amount: number }[] = [];

    const txRows = await db.getAllAsync<any>(
      `SELECT date, amount FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
      [start, end]
    );

    const dayMap = new Map<number, number>();
    for (const tx of txRows) {
      const d = new Date(tx.date).getDate();
      dayMap.set(d, (dayMap.get(d) || 0) + tx.amount);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      dailyExpenses.push({
        day,
        dateStr: `${day} ${THAI_MONTHS_SHORT[month - 1]}`,
        amount: dayMap.get(day) || 0,
      });
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      categoryExpenses,
      dailyExpenses,
    };
  } else {
    // Yearly
    const start = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
    const end = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

    const incRow = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
      [start, end]
    );
    const expRow = await db.getFirstAsync<{ total: number }>(
      `SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
      [start, end]
    );
    const totalIncome = incRow?.total || 0;
    const totalExpense = expRow?.total || 0;

    const catRows = await db.getAllAsync<any>(
      `SELECT c.name, c.color, c.icon, SUM(t.amount) as amount
       FROM transactions t
       JOIN categories c ON t.categoryId = c.id
       WHERE t.type = 'EXPENSE' AND t.date >= ? AND t.date <= ?
       GROUP BY c.id
       ORDER BY amount DESC`,
      [start, end]
    );

    const categoryExpenses = catRows.map((c) => ({
      name: c.name,
      amount: c.amount,
      color: c.color || '#64748b',
      icon: c.icon || 'Tag',
      percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    }));

    // Monthly breakdown
    const monthlyBreakdown: { monthName: string; income: number; expense: number; net: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const mStart = new Date(year, m - 1, 1, 0, 0, 0, 0).toISOString();
      const mEnd = new Date(year, m, 0, 23, 59, 59, 999).toISOString();

      const mInc = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ?`,
        [mStart, mEnd]
      );
      const mExp = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ?`,
        [mStart, mEnd]
      );
      const iVal = mInc?.total || 0;
      const eVal = mExp?.total || 0;
      monthlyBreakdown.push({
        monthName: THAI_MONTHS_SHORT[m - 1],
        income: iVal,
        expense: eVal,
        net: iVal - eVal,
      });
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      categoryExpenses,
      monthlyBreakdown,
    };
  }
}

// ----------------------------------------------------
// APP CONFIG & SECURITY
// ----------------------------------------------------
export async function getAppConfig(): Promise<AppConfigData> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM app_config WHERE id = "default"');
  if (!row) {
    return {
      id: 'default',
      isPinEnabled: false,
      pinHash: null,
      pinSalt: null,
      currency: 'THB',
      theme: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: row.id,
    isPinEnabled: Boolean(row.isPinEnabled),
    pinHash: row.pinHash,
    pinSalt: row.pinSalt,
    currency: row.currency,
    theme: row.theme,
    lastBackupAt: row.lastBackupAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function setAppPin(pin: string | null): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (!pin) {
    await db.runAsync(
      `UPDATE app_config SET isPinEnabled = 0, pinHash = NULL, pinSalt = NULL, updatedAt = ? WHERE id = 'default'`,
      [now]
    );
  } else {
    const salt = Crypto.randomUUID().replace(/-/g, '');
    const salted = `${salt}:${pin}:${salt}`;
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, salted);

    await db.runAsync(
      `UPDATE app_config SET isPinEnabled = 1, pinHash = ?, pinSalt = ?, updatedAt = ? WHERE id = 'default'`,
      [hash, salt, now]
    );
  }
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const cfg = await getAppConfig();
  if (!cfg.isPinEnabled || !cfg.pinHash || !cfg.pinSalt) return true;

  const salted = `${cfg.pinSalt}:${pin}:${cfg.pinSalt}`;
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, salted);
  return hash === cfg.pinHash;
}

// ----------------------------------------------------
// BACKUP & RESTORE
// ----------------------------------------------------
export async function exportAllData(): Promise<string> {
  const db = await getDatabase();
  const accounts = await db.getAllAsync('SELECT * FROM accounts');
  const categories = await db.getAllAsync('SELECT * FROM categories');
  const transactions = await db.getAllAsync('SELECT * FROM transactions');
  const budgets = await db.getAllAsync('SELECT * FROM budgets');
  const recurring = await db.getAllAsync('SELECT * FROM recurring_expenses');
  const config = await db.getFirstAsync('SELECT * FROM app_config WHERE id = "default"');

  const exportObj = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    data: {
      accounts,
      categories,
      transactions,
      budgets,
      recurring,
      config,
    },
  };

  await db.runAsync(
    `UPDATE app_config SET lastBackupAt = ?, updatedAt = ? WHERE id = 'default'`,
    [new Date().toISOString(), new Date().toISOString()]
  );

  return JSON.stringify(exportObj, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString);
  const data = parsed.data || parsed;
  if (!data.accounts || !data.categories) {
    throw new Error('รูปแบบไฟล์ข้อมูลสำรองไม่ถูกต้อง');
  }

  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM recurring_expenses;
    DELETE FROM budgets;
    DELETE FROM categories;
    DELETE FROM accounts;
  `);

  // Accounts
  for (const acc of data.accounts) {
    await db.runAsync(
      `INSERT INTO accounts (id, name, type, initialBalance, currentBalance, currency, color, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        acc.id,
        acc.name,
        acc.type,
        acc.initialBalance,
        acc.currentBalance,
        acc.currency || 'THB',
        acc.color || '#3b82f6',
        acc.isActive ? 1 : 0,
        acc.createdAt || new Date().toISOString(),
        acc.updatedAt || new Date().toISOString(),
      ]
    );
  }

  // Categories
  for (const cat of data.categories) {
    await db.runAsync(
      `INSERT INTO categories (id, name, type, icon, color, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cat.id,
        cat.name,
        cat.type,
        cat.icon || 'Tag',
        cat.color || '#64748b',
        cat.isActive ? 1 : 0,
        cat.createdAt || new Date().toISOString(),
        cat.updatedAt || new Date().toISOString(),
      ]
    );
  }

  // Budgets
  if (Array.isArray(data.budgets)) {
    for (const b of data.budgets) {
      await db.runAsync(
        `INSERT INTO budgets (id, categoryId, amount, month, year, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.categoryId, b.amount, b.month, b.year, b.createdAt || new Date().toISOString(), b.updatedAt || new Date().toISOString()]
      );
    }
  }

  // Recurring
  if (Array.isArray(data.recurring)) {
    for (const r of data.recurring) {
      await db.runAsync(
        `INSERT INTO recurring_expenses (id, name, amount, type, categoryId, accountId, frequency, dayOfMonth, dayOfWeek, lastRunDate, nextDueDate, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.name,
          r.amount,
          r.type || 'EXPENSE',
          r.categoryId,
          r.accountId,
          r.frequency || 'MONTHLY',
          r.dayOfMonth ?? 1,
          r.dayOfWeek ?? null,
          r.lastRunDate ?? null,
          r.nextDueDate || new Date().toISOString(),
          r.isActive ? 1 : 0,
          r.createdAt || new Date().toISOString(),
          r.updatedAt || new Date().toISOString(),
        ]
      );
    }
  }

  // Transactions
  if (Array.isArray(data.transactions)) {
    for (const t of data.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, accountId, toAccountId, categoryId, type, amount, date, note, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.accountId,
          t.toAccountId ?? null,
          t.categoryId ?? null,
          t.type,
          t.amount,
          t.date,
          t.note ?? null,
          t.createdAt || new Date().toISOString(),
          t.updatedAt || new Date().toISOString(),
        ]
      );
    }
  }

  await reconcileAllAccounts(db);
}
