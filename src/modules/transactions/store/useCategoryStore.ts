import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import type { CategoryInfo } from '@/types/transaction';

interface CategoryState {
  customCategories: CategoryInfo[];
  addCustomCategory: (category: Omit<CategoryInfo, 'key'>) => void;
  removeCustomCategory: (key: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      customCategories: [],
      addCustomCategory: (category) =>
        set((state) => {
          const newKey = `custom_${Date.now()}_${category.label.toLowerCase().replace(/\s+/g, '_')}`;
          const newCategory: CategoryInfo = {
            ...category,
            key: newKey,
          };
          return { customCategories: [...state.customCategories, newCategory] };
        }),
      removeCustomCategory: (key) =>
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.key !== key),
        })),
    }),
    {
      name: 'category-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);
