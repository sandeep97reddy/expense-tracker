import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';

interface BudgetState {
  budgets: Record<string, number>; // categoryId -> monthly budget limit
  
  // Actions
  setBudget: (categoryId: string, amount: number) => void;
  removeBudget: (categoryId: string) => void;
  getBudget: (categoryId: string) => number | undefined;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: {},
      
      setBudget: (categoryId, amount) => {
        set((state) => ({
          budgets: {
            ...state.budgets,
            [categoryId]: amount,
          },
        }));
      },
      
      removeBudget: (categoryId) => {
        set((state) => {
          const newBudgets = { ...state.budgets };
          delete newBudgets[categoryId];
          return { budgets: newBudgets };
        });
      },
      
      getBudget: (categoryId) => {
        return get().budgets[categoryId];
      },
    }),
    {
      name: 'expense-tracker-budgets',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
