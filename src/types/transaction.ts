/**
 * Transaction type definitions
 * Core data models from the Architecture spec.
 */

/** Transaction types */
export type TransactionType = 'income' | 'expense' | 'transfer';

/** Income categories */
export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'rental'
  | 'gifts'
  | 'business'
  | 'cashback'
  | 'refunds'
  | 'part_time'
  | 'other_income';

/** Expense categories */
export type ExpenseCategory =
  | 'food'
  | 'shopping'
  | 'electronics'
  | 'salon'
  | 'recharge'
  | 'dth'
  | 'fuel'
  | 'travel'
  | 'rent'
  | 'healthcare'
  | 'entertainment'
  | 'groceries'
  | 'education'
  | 'internet'
  | 'emi'
  | 'subscriptions'
  | 'fitness'
  | 'pets'
  | 'other_expense';

/** Transfer categories */
export type TransferCategory =
  | 'wallet_transfer'
  | 'bank_transfer'
  | 'internal_transfer';

/** All category types (including dynamic custom categories) */
export type CategoryType = IncomeCategory | ExpenseCategory | TransferCategory | (string & {});

/** Category display info */
export interface CategoryInfo {
  key: CategoryType;
  label: string;
  icon: string;
  color: string;
  type: TransactionType;
}

/** Split expense details */
export interface SplitDetail {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
}

/** Core transaction entity */
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: CategoryType;
  title: string;
  note?: string;
  tags?: string[];
  date: string; // ISO 8601
  monthKey: string; // 'YYYY-MM'
  recurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  attachments?: string[]; // URI paths
  // Transfer-specific fields
  fromAccount?: string;
  toAccount?: string;
  // Split-specific fields
  splitDetails?: SplitDetail[];
  workspaceId?: string; // Optional parent workspace ID
  // UPI-specific fields
  upiId?: string;
  payeeName?: string;
  transactionType?: 'merchant' | 'p2p';
  merchantCategory?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Recurrence configuration */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

/** Monthly statistics */
export interface MonthlyStats {
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  categoryBreakdown: Record<string, number>;
  transactionCount: number;
}

/** UPI Payment data */
export interface UPIPaymentData {
  upiId: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  originalQRData?: string;
  isMerchant: boolean;
  merchantParams?: MerchantParams;
}

/** Merchant-specific QR parameters */
export interface MerchantParams {
  sign?: string;
  mc?: string;
  mode?: string;
  orgid?: string;
  purpose?: string;
  tid?: string;
}
