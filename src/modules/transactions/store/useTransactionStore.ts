/**
 * Transactions Zustand Store
 * Manages local, offline-first transaction ledger state.
 * Fully persisted using MMKV. Includes CRUD, recurring engine triggers, and analytics selectors.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import type { Transaction, MonthlyStats, RecurrenceRule } from '@/types/transaction';
import { generateId, getMonthKey } from '@/utils/helpers';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';

const getInitialTransactions = (): Transaction[] => {
  const now = new Date();
  const getPastDateISO = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  // Mock Transactions for Personal Account
  const personalTx: Transaction[] = [
    {
      id: 'personal_tx_1',
      amount: 4500,
      type: 'income',
      category: 'salary',
      title: 'Monthly Salary Paycheck',
      date: getPastDateISO(1),
      monthKey: getMonthKey(new Date(getPastDateISO(1))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'personal_tx_2',
      amount: 145,
      type: 'expense',
      category: 'food',
      title: 'Organic Food Cafe Lunch',
      date: getPastDateISO(2),
      monthKey: getMonthKey(new Date(getPastDateISO(2))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'personal_tx_3',
      amount: 60,
      type: 'expense',
      category: 'shopping',
      title: 'Weekly Book Purchase',
      date: getPastDateISO(5),
      monthKey: getMonthKey(new Date(getPastDateISO(5))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Mock Transactions for Family Joint Account (family_workspace_id)
  const familyTx: Transaction[] = [
    {
      id: 'family_tx_1',
      amount: 7200,
      type: 'income',
      category: 'salary',
      title: 'Joint Income Deposit',
      workspaceId: 'family_workspace_id',
      date: getPastDateISO(3),
      monthKey: getMonthKey(new Date(getPastDateISO(3))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'family_tx_2',
      amount: 1500,
      type: 'expense',
      category: 'rent',
      title: 'Apartment Monthly Rent',
      workspaceId: 'family_workspace_id',
      date: getPastDateISO(5),
      monthKey: getMonthKey(new Date(getPastDateISO(5))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'family_tx_3',
      amount: 320,
      type: 'expense',
      category: 'groceries',
      title: 'Whole Foods Family Basket',
      workspaceId: 'family_workspace_id',
      date: getPastDateISO(1),
      monthKey: getMonthKey(new Date(getPastDateISO(1))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'family_tx_4',
      amount: 85,
      type: 'expense',
      category: 'subscriptions',
      title: 'Netflix & Spotify Family Pack',
      workspaceId: 'family_workspace_id',
      date: getPastDateISO(0),
      monthKey: getMonthKey(new Date(getPastDateISO(0))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'family_tx_5',
      amount: 120,
      type: 'expense',
      category: 'fuel',
      title: 'Weekly Gas Station Refill',
      workspaceId: 'family_workspace_id',
      date: getPastDateISO(2),
      monthKey: getMonthKey(new Date(getPastDateISO(2))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Mock Transactions for Roommate Sync (roommates_workspace_id)
  const roommatesTx: Transaction[] = [
    {
      id: 'roommate_tx_1',
      amount: 600,
      type: 'income',
      category: 'gifts',
      title: 'Freelance Design Pool',
      workspaceId: 'roommates_workspace_id',
      date: getPastDateISO(6),
      monthKey: getMonthKey(new Date(getPastDateISO(6))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'roommate_tx_2',
      amount: 110,
      type: 'expense',
      category: 'internet',
      title: 'Gigabit Fiber Internet Bill',
      workspaceId: 'roommates_workspace_id',
      date: getPastDateISO(2),
      monthKey: getMonthKey(new Date(getPastDateISO(2))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'roommate_tx_3',
      amount: 45,
      type: 'expense',
      category: 'groceries',
      title: 'Household Cleaning Supplies',
      workspaceId: 'roommates_workspace_id',
      date: getPastDateISO(1),
      monthKey: getMonthKey(new Date(getPastDateISO(1))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'roommate_tx_4',
      amount: 280,
      type: 'expense',
      category: 'emi',
      title: 'Living Room Smart TV Share',
      workspaceId: 'roommates_workspace_id',
      date: getPastDateISO(4),
      monthKey: getMonthKey(new Date(getPastDateISO(4))),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  return [...personalTx, ...familyTx, ...roommatesTx];
};

interface TransactionState {
  /** Unsorted master list of all transactions */
  transactions: Transaction[];

  // CRUD Actions
  /** Create a new transaction, stamping ID and timestamps. Returns the generated ID. */
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'monthKey'>,
  ) => string;
  /** Edit an existing transaction by ID */
  updateTransaction: (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => void;
  /** Delete a transaction by ID */
  deleteTransaction: (id: string) => void;

  // Active Offline Reconciliation Engine
  /** Trigger scan of recurring templates and generate due transactions */
  processRecurringTransactions: () => { generatedCount: number };
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (tx) => {
        const now = new Date();
        const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
        const newTx: Transaction = {
          ...tx,
          id: generateId(),
          workspaceId: activeWorkspaceId || undefined,
          monthKey: getMonthKey(new Date(tx.date)),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions],
        }));

        return newTx.id;
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) => {
            if (tx.id !== id) return tx;

            const updatedDate = updates.date ? new Date(updates.date) : new Date(tx.date);
            return {
              ...tx,
              ...updates,
              monthKey: getMonthKey(updatedDate),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      processRecurringTransactions: () => {
        const { transactions } = get();
        const now = new Date();
        const generated: Transaction[] = [];

        transactions.forEach((tx) => {
          // Only process templates that are marked as recurring and have recurrence rules
          if (!tx.recurring || !tx.recurrenceRule) return;

          const lastDate = new Date(tx.date);
          const nextDates = getDueRecurringDates(lastDate, tx.recurrenceRule, now);

          nextDates.forEach((dueDate) => {
            // Avoid duplicate insertions (check if transaction already exists for this template on this date)
            const isDuplicate = transactions.some(
              (t) =>
                t.title === tx.title &&
                t.amount === tx.amount &&
                new Date(t.date).toDateString() === dueDate.toDateString(),
            );

            if (!isDuplicate) {
              const newTx: Transaction = {
                ...tx,
                id: generateId(),
                date: dueDate.toISOString(),
                monthKey: getMonthKey(dueDate),
                recurring: false, // Generated instances are normal transactions
                recurrenceRule: undefined,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
              };
              generated.push(newTx);
            }
          });
        });

        if (generated.length > 0) {
          set((state) => ({
            transactions: [...generated, ...state.transactions],
          }));
        }

        return { generatedCount: generated.length };
      },
    }),
    {
      name: 'transactions-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.transactions.length === 0) {
          state.transactions = getInitialTransactions();
        }
      },
    },
  ),
);

/**
 * Helper to calculate all due dates between the starting date and now for a recurring pattern
 */
function getDueRecurringDates(
  startDate: Date,
  rule: RecurrenceRule,
  untilDate: Date,
): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);
  const interval = rule.interval || 1;
  const endLimit = rule.endDate ? new Date(rule.endDate) : untilDate;
  const limit = endLimit < untilDate ? endLimit : untilDate;

  // Add frequency increments until we surpass the limit
  while (true) {
    switch (rule.frequency) {
      case 'daily':
        current.setDate(current.getDate() + interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7 * interval);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + interval);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + interval);
        break;
    }

    if (current > limit) break;
    dates.push(new Date(current));
  }

  return dates;
}

/** Filter transactions to personal account or active workspace (matches Dashboard). */
export function filterTransactionsForWorkspace(
  transactions: Transaction[],
  activeWorkspaceId: string | null,
): Transaction[] {
  return transactions.filter((tx) =>
    activeWorkspaceId ? tx.workspaceId === activeWorkspaceId : !tx.workspaceId,
  );
}

/** Workspace-scoped transaction list with memoized filtering. */
export function useWorkspaceTransactions(): Transaction[] {
  const transactions = useTransactionStore((state) => state.transactions);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  return useMemo(
    () => filterTransactionsForWorkspace(transactions, activeWorkspaceId),
    [transactions, activeWorkspaceId],
  );
}

/** Select a single transaction by ID. */
export function useTransactionById(id: string): Transaction | undefined {
  return useTransactionStore((state) => state.transactions.find((tx) => tx.id === id));
}

/**
 * High-performance selector for getting comprehensive monthly calculations
 */
export function useMonthlyStats(monthKey: string): MonthlyStats {
  const workspaceTransactions = useWorkspaceTransactions();

  return useMemo(() => {
    const filtered = workspaceTransactions.filter((tx) => tx.monthKey === monthKey);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    filtered.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    });

    return {
      monthKey,
      totalIncome,
      totalExpense,
      savings: totalIncome - totalExpense,
      categoryBreakdown,
      transactionCount: filtered.length,
    };
  }, [workspaceTransactions, monthKey]);
}

/**
 * High-performance selector to get global ledger balances
 */
export function useGlobalBalance() {
  const workspaceTransactions = useWorkspaceTransactions();

  return useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    workspaceTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
    });

    return {
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
    };
  }, [workspaceTransactions]);
}

/**
 * Selector to extract unique tags across workspace transactions for filters
 */
export function useUniqueTags(): string[] {
  const workspaceTransactions = useWorkspaceTransactions();

  return useMemo(() => {
    const tagsSet = new Set<string>();

    workspaceTransactions.forEach((tx) => {
      tx.tags?.forEach((tag) => tagsSet.add(tag.trim().toLowerCase()));
    });

    return Array.from(tagsSet).sort();
  }, [workspaceTransactions]);
}
