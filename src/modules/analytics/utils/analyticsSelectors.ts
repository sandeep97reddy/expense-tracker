import { Transaction, CategoryType } from '@/types/transaction';
import { getCategoryDetails } from '@/modules/transactions/utils/categories';

export interface PieChartData {
  value: number;
  color: string;
  text: string;
  category: CategoryType;
  label: string;
}

export interface BarChartData {
  value: number;
  frontColor: string;
  label?: string;
  spacing?: number;
}

export interface BudgetProgress {
  categoryId: string;
  label: string;
  spent: number;
  limit: number;
  percentage: number;
  color: string;
  icon: string;
}

/**
 * Returns formatted data for a Pie chart (Expenses only) for a given month
 */
export function getCategoryBreakdown(transactions: Transaction[], monthKey: string): PieChartData[] {
  const expenses = transactions.filter(t => t.type === 'expense' && t.monthKey === monthKey);
  
  const grouped = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(grouped)
    .sort(([, a], [, b]) => b - a);

  return sortedCategories.map(([categoryKey, amount]) => {
    const details = getCategoryDetails(categoryKey as CategoryType);
    return {
      value: amount,
      color: details.color,
      text: Math.round(amount).toString(),
      category: categoryKey as CategoryType,
      label: details.label,
    };
  });
}

/**
 * Returns formatted data for a Bar chart (Income vs Expense) for a given year
 * Format for react-native-gifted-charts grouped bars
 */
export function getMonthlyTrends(transactions: Transaction[], year: number) {
  const prefix = `${year}-`;
  const yearTransactions = transactions.filter(t => t.monthKey.startsWith(prefix) && (t.type === 'income' || t.type === 'expense'));
  
  // Group by month
  const monthlyData: Record<string, { income: number, expense: number }> = {};
  for (let i = 1; i <= 12; i++) {
    const mk = `${year}-${i.toString().padStart(2, '0')}`;
    monthlyData[mk] = { income: 0, expense: 0 };
  }

  yearTransactions.forEach(t => {
    const data = monthlyData[t.monthKey];
    if (!data) return;
    if (t.type === 'income') {
      data.income += t.amount;
    } else if (t.type === 'expense') {
      data.expense += t.amount;
    }
  });

  const chartData: BarChartData[] = [];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  Object.keys(monthlyData).sort().forEach((mk, index) => {
    const data = monthlyData[mk];
    if (!data) return;
    // Income Bar
    chartData.push({
      value: data.income,
      frontColor: '#10B981', // Emerald
      label: monthLabels[index],
      spacing: 4,
    });
    // Expense Bar
    chartData.push({
      value: data.expense,
      frontColor: '#EF4444', // Red
    });
  });

  return chartData;
}

/**
 * Returns budget progress for all categories that have a budget set
 */
export function getBudgetProgress(transactions: Transaction[], budgets: Record<string, number>, monthKey: string): BudgetProgress[] {
  const expenses = transactions.filter(t => t.type === 'expense' && t.monthKey === monthKey);
  
  const spentByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(budgets).map(([categoryId, limit]) => {
    const spent = spentByCategory[categoryId] || 0;
    const details = getCategoryDetails(categoryId as CategoryType);
    let percentage = (spent / limit) * 100;
    if (percentage > 100) percentage = 100;

    return {
      categoryId,
      label: details.label,
      spent,
      limit,
      percentage,
      color: details.color,
      icon: details.icon,
    };
  }).sort((a, b) => b.percentage - a.percentage); // Sort by highest usage
}
