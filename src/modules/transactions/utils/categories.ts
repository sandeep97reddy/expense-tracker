/**
 * Categories utility
 * Maps category keys to display labels, icons, and theme-appropriate colors.
 */

import type { CategoryInfo, CategoryType, TransactionType } from '@/types/transaction';

export const CATEGORY_DETAILS: Record<CategoryType, CategoryInfo> = {
  // Income Categories
  salary: {
    key: 'salary',
    label: 'Salary',
    icon: 'cash-outline',
    color: '#10B981', // Emerald
    type: 'income',
  },
  freelance: {
    key: 'freelance',
    label: 'Freelance',
    icon: 'laptop-outline',
    color: '#06B6D4', // Cyan
    type: 'income',
  },
  investments: {
    key: 'investments',
    label: 'Investments',
    icon: 'trending-up-outline',
    color: '#3B82F6', // Blue
    type: 'income',
  },
  rental: {
    key: 'rental',
    label: 'Rental',
    icon: 'business-outline',
    color: '#F59E0B', // Amber
    type: 'income',
  },
  gifts: {
    key: 'gifts',
    label: 'Gifts',
    icon: 'gift-outline',
    color: '#EC4899', // Pink
    type: 'income',
  },
  business: {
    key: 'business',
    label: 'Business',
    icon: 'briefcase-outline',
    color: '#8B5CF6', // Purple
    type: 'income',
  },
  part_time: {
    key: 'part_time',
    label: 'Part-Time',
    icon: 'time-outline',
    color: '#14B8A6', // Teal
    type: 'income',
  },
  other_income: {
    key: 'other_income',
    label: 'Other Income',
    icon: 'ellipsis-horizontal-outline',
    color: '#64748B', // Slate
    type: 'income',
  },

  // Expense Categories
  food: {
    key: 'food',
    label: 'Food & Dining',
    icon: 'fast-food-outline',
    color: '#EF4444', // Red
    type: 'expense',
  },
  groceries: {
    key: 'groceries',
    label: 'Groceries',
    icon: 'cart-outline',
    color: '#F97316', // Orange
    type: 'expense',
  },
  rent: {
    key: 'rent',
    label: 'Rent & Housing',
    icon: 'home-outline',
    color: '#8B5CF6', // Purple
    type: 'expense',
  },
  emi: {
    key: 'emi',
    label: 'Loans & EMI',
    icon: 'card-outline',
    color: '#3B82F6', // Blue
    type: 'expense',
  },
  fuel: {
    key: 'fuel',
    label: 'Fuel & Vehicle',
    icon: 'car-outline',
    color: '#10B981', // Emerald
    type: 'expense',
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    icon: 'shirt-outline',
    color: '#EC4899', // Pink
    type: 'expense',
  },
  healthcare: {
    key: 'healthcare',
    label: 'Healthcare',
    icon: 'medical-outline',
    color: '#F43F5E', // Rose
    type: 'expense',
  },
  internet: {
    key: 'internet',
    label: 'Internet & Phone',
    icon: 'wifi-outline',
    color: '#06B6D4', // Cyan
    type: 'expense',
  },
  travel: {
    key: 'travel',
    label: 'Travel',
    icon: 'airplane-outline',
    color: '#0EA5E9', // Sky
    type: 'expense',
  },
  education: {
    key: 'education',
    label: 'Education',
    icon: 'book-outline',
    color: '#6366F1', // Indigo
    type: 'expense',
  },
  subscriptions: {
    key: 'subscriptions',
    label: 'Subscriptions',
    icon: 'play-circle-outline',
    color: '#D946EF', // Fuchsia
    type: 'expense',
  },
  taxes: {
    key: 'taxes',
    label: 'Taxes & Fees',
    icon: 'document-text-outline',
    color: '#EF4444', // Red
    type: 'expense',
  },
  entertainment: {
    key: 'entertainment',
    label: 'Entertainment',
    icon: 'game-controller-outline',
    color: '#F59E0B', // Amber
    type: 'expense',
  },
  other_expense: {
    key: 'other_expense',
    label: 'Other Expense',
    icon: 'ellipsis-horizontal-outline',
    color: '#64748B', // Slate
    type: 'expense',
  },

  // Transfer Categories
  wallet_transfer: {
    key: 'wallet_transfer',
    label: 'Wallet Transfer',
    icon: 'wallet-outline',
    color: '#8B5CF6', // Purple
    type: 'transfer',
  },
  bank_transfer: {
    key: 'bank_transfer',
    label: 'Bank Transfer',
    icon: 'business-outline',
    color: '#3B82F6', // Blue
    type: 'transfer',
  },
  internal_transfer: {
    key: 'internal_transfer',
    label: 'Internal Transfer',
    icon: 'repeat-outline',
    color: '#14B8A6', // Teal
    type: 'transfer',
  },
};

/** Get categories filtered by transaction type */
export function getCategoriesByType(type: TransactionType): CategoryInfo[] {
  return Object.values(CATEGORY_DETAILS).filter((cat) => cat.type === type);
}

/** Get specific category details by key, returning safe fallback if not found */
export function getCategoryDetails(key: CategoryType): CategoryInfo {
  return (
    CATEGORY_DETAILS[key] || {
      key: 'other_expense',
      label: 'Other',
      icon: 'ellipsis-horizontal-outline',
      color: '#64748B',
      type: 'expense',
    }
  );
}
