/**
 * Categories utility
 * Maps category keys to display labels, icons, and theme-appropriate colors.
 */

import type { CategoryInfo, CategoryType, TransactionType } from '@/types/transaction';
import { useCategoryStore } from '../store/useCategoryStore';

export const CATEGORY_DETAILS: Record<string, CategoryInfo> = {
  // Income Categories
  salary: { key: 'salary', label: 'Salary', icon: 'cash-outline', color: '#10B981', type: 'income' },
  freelance: { key: 'freelance', label: 'Freelance', icon: 'laptop-outline', color: '#06B6D4', type: 'income' },
  investments: { key: 'investments', label: 'Investments', icon: 'trending-up-outline', color: '#3B82F6', type: 'income' },
  rental: { key: 'rental', label: 'Rental', icon: 'business-outline', color: '#F59E0B', type: 'income' },
  gifts: { key: 'gifts', label: 'Gifts', icon: 'gift-outline', color: '#EC4899', type: 'income' },
  business: { key: 'business', label: 'Business', icon: 'briefcase-outline', color: '#8B5CF6', type: 'income' },
  cashback: { key: 'cashback', label: 'Cashback', icon: 'pricetag-outline', color: '#14B8A6', type: 'income' },
  refunds: { key: 'refunds', label: 'Refunds', icon: 'refresh-outline', color: '#0EA5E9', type: 'income' },
  part_time: { key: 'part_time', label: 'Part-Time', icon: 'time-outline', color: '#8B5CF6', type: 'income' },
  other_income: { key: 'other_income', label: 'Other Income', icon: 'ellipsis-horizontal-outline', color: '#64748B', type: 'income' },

  // Expense Categories
  food: { key: 'food', label: 'Food & Dining', icon: 'fast-food-outline', color: '#EF4444', type: 'expense' },
  shopping: { key: 'shopping', label: 'Shopping', icon: 'shirt-outline', color: '#EC4899', type: 'expense' },
  electronics: { key: 'electronics', label: 'Electronics', icon: 'desktop-outline', color: '#3B82F6', type: 'expense' },
  salon: { key: 'salon', label: 'Salon & Spa', icon: 'cut-outline', color: '#F43F5E', type: 'expense' },
  recharge: { key: 'recharge', label: 'Recharge', icon: 'phone-portrait-outline', color: '#06B6D4', type: 'expense' },
  dth: { key: 'dth', label: 'DTH', icon: 'tv-outline', color: '#8B5CF6', type: 'expense' },
  fuel: { key: 'fuel', label: 'Fuel', icon: 'car-outline', color: '#10B981', type: 'expense' },
  travel: { key: 'travel', label: 'Travel', icon: 'airplane-outline', color: '#0EA5E9', type: 'expense' },
  rent: { key: 'rent', label: 'Rent', icon: 'home-outline', color: '#8B5CF6', type: 'expense' },
  healthcare: { key: 'healthcare', label: 'Healthcare', icon: 'medical-outline', color: '#F43F5E', type: 'expense' },
  entertainment: { key: 'entertainment', label: 'Entertainment', icon: 'game-controller-outline', color: '#F59E0B', type: 'expense' },
  groceries: { key: 'groceries', label: 'Groceries', icon: 'cart-outline', color: '#F97316', type: 'expense' },
  education: { key: 'education', label: 'Education', icon: 'book-outline', color: '#6366F1', type: 'expense' },
  internet: { key: 'internet', label: 'Internet', icon: 'wifi-outline', color: '#06B6D4', type: 'expense' },
  emi: { key: 'emi', label: 'EMI', icon: 'card-outline', color: '#3B82F6', type: 'expense' },
  subscriptions: { key: 'subscriptions', label: 'Subscriptions', icon: 'play-circle-outline', color: '#D946EF', type: 'expense' },
  fitness: { key: 'fitness', label: 'Fitness', icon: 'barbell-outline', color: '#10B981', type: 'expense' },
  pets: { key: 'pets', label: 'Pets', icon: 'paw-outline', color: '#F97316', type: 'expense' },
  other_expense: { key: 'other_expense', label: 'Other Expense', icon: 'ellipsis-horizontal-outline', color: '#64748B', type: 'expense' },

  // Transfer Categories
  wallet_transfer: { key: 'wallet_transfer', label: 'Wallet Transfer', icon: 'wallet-outline', color: '#8B5CF6', type: 'transfer' },
  bank_transfer: { key: 'bank_transfer', label: 'Bank Transfer', icon: 'business-outline', color: '#3B82F6', type: 'transfer' },
  internal_transfer: { key: 'internal_transfer', label: 'Internal Transfer', icon: 'repeat-outline', color: '#14B8A6', type: 'transfer' },
};

/** Get categories filtered by transaction type */
export function getCategoriesByType(type: TransactionType): CategoryInfo[] {
  const custom = useCategoryStore.getState().customCategories.filter((c) => c.type === type);
  const base = Object.values(CATEGORY_DETAILS).filter((cat) => cat.type === type);
  return [...base, ...custom];
}

/** Get specific category details by key, returning safe fallback if not found */
export function getCategoryDetails(key: CategoryType): CategoryInfo {
  if (CATEGORY_DETAILS[key]) {
    return CATEGORY_DETAILS[key];
  }
  
  const custom = useCategoryStore.getState().customCategories.find((c) => c.key === key);
  if (custom) {
    return custom;
  }

  return {
    key: 'other_expense',
    label: 'Other',
    icon: 'ellipsis-horizontal-outline',
    color: '#64748B',
    type: 'expense',
  };
}
