import React, { useMemo, useState, memo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useWorkspaceTransactions } from '@/modules/transactions/store/useTransactionStore';
import { useBudgetStore } from '@/modules/analytics/store/useBudgetStore';
import { useTheme } from '@/hooks/useTheme';
import {
  getCategoryBreakdown,
  getMonthlyTrends,
  getBudgetProgress,
  type PieChartData,
  type BarChartData,
  type BudgetProgress,
} from '@/modules/analytics/utils/analyticsSelectors';
import { getMonthKey, formatCurrency } from '@/utils/helpers';
import { getCategoriesByType } from '@/modules/transactions/utils/categories';
import { useTranslation } from '@/hooks/useTranslation';
import type { CategoryInfo } from '@/types/transaction';

type AnalyticsTab = 'overview' | 'trends' | 'budgets';

interface TabLayoutProps {
  textAlignment: 'left' | 'right';
  flexDirectionStyle: 'row' | 'row-reverse';
}

interface OverviewTabProps extends TabLayoutProps {
  pieData: PieChartData[];
  totalSpending: number;
  t: (key: string, fallback?: string) => string;
  tCategory: (category: string) => string;
}

interface TrendsTabProps extends TabLayoutProps {
  barData: BarChartData[];
  currentYear: number;
  t: (key: string, fallback?: string) => string;
}

interface BudgetsTabProps extends TabLayoutProps {
  budgetProgress: BudgetProgress[];
  expenseCategories: CategoryInfo[];
  onSetBudget: (categoryId: string, amount: number) => void;
  t: (key: string, fallback?: string) => string;
  tCategory: (category: string) => string;
}

const AnalyticsOverviewTab = memo(function AnalyticsOverviewTab({
  pieData,
  totalSpending,
  textAlignment,
  flexDirectionStyle,
  t,
  tCategory,
}: OverviewTabProps) {
  const { colors, isDark } = useTheme();

  return (
    <View>
      <View className="mb-6">
        <Card>
          <View style={{ alignItems: textAlignment === 'right' ? 'flex-end' : 'flex-start' }}>
            <Text className="text-lg font-bold text-text mb-6">{t('analytics.categoryBreakdown')}</Text>

            {pieData.length === 0 ? (
              <View className="h-40 w-full items-center justify-center">
                <Text className="text-text-muted">{t('analytics.noTrendData', 'No expenses this month')}</Text>
              </View>
            ) : (
              <View className="w-full items-center justify-center relative">
                <PieChart
                  data={pieData}
                  donut
                  showText
                  textColor={isDark ? "white" : "black"}
                  fontWeight='bold'
                  radius={120}
                  innerRadius={70}
                  innerCircleColor={colors.card}
                  textSize={14}
                />
                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  <Text className="text-sm font-bold" style={{ color: colors.text }}>{t('analytics.totalSpending')}</Text>
                  <Text className="text-xl font-bold" style={{ color: colors.text }}>{formatCurrency(totalSpending)}</Text>
                </View>
              </View>
            )}
          </View>
        </Card>
      </View>

      <Text style={{ textAlign: textAlignment }} className="text-lg font-bold text-text mb-4 px-2">
        {t('analytics.categoryBreakdown')}
      </Text>
      <View className="gap-3">
        {pieData.map((d) => (
          <View key={d.category}>
            <Card>
              <View style={{ flexDirection: flexDirectionStyle }} className="items-center">
                <View
                  className="w-4 h-4 rounded-full mr-4"
                  style={{
                    backgroundColor: d.color,
                    marginRight: flexDirectionStyle === 'row-reverse' ? 0 : 16,
                    marginLeft: flexDirectionStyle === 'row-reverse' ? 16 : 0,
                  }}
                />
                <Text className="flex-1 text-base font-bold text-text" style={{ textAlign: textAlignment }}>
                  {tCategory(d.category)}
                </Text>
                <Text className="text-base font-bold text-text">{formatCurrency(d.value)}</Text>
              </View>
            </Card>
          </View>
        ))}
      </View>
    </View>
  );
});

const AnalyticsTrendsTab = memo(function AnalyticsTrendsTab({
  barData,
  currentYear,
  textAlignment,
  flexDirectionStyle,
  t,
}: TrendsTabProps) {
  return (
    <View>
      <View className="mb-6">
        <Card>
          <View style={{ alignItems: textAlignment === 'right' ? 'flex-end' : 'flex-start' }}>
            <Text className="text-lg font-bold text-text mb-2">
              {t('transactions.income')} vs {t('transactions.expense')} ({currentYear})
            </Text>
            <View style={{ flexDirection: flexDirectionStyle }} className="items-center mb-6 gap-4">
              <View style={{ flexDirection: flexDirectionStyle }} className="items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-emerald-500" />
                <Text className="text-sm text-text-muted">{t('transactions.income')}</Text>
              </View>
              <View style={{ flexDirection: flexDirectionStyle }} className="items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-red-500" />
                <Text className="text-sm text-text-muted">{t('transactions.expense')}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ width: Math.max(barData.length * 40, 300) }}>
                <BarChart
                  data={barData}
                  barWidth={18}
                  spacing={24}
                  roundedTop
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: '#64748B' }}
                  noOfSections={4}
                />
              </View>
            </ScrollView>
          </View>
        </Card>
      </View>
    </View>
  );
});

const AnalyticsBudgetsTab = memo(function AnalyticsBudgetsTab({
  budgetProgress,
  expenseCategories,
  onSetBudget,
  textAlignment,
  flexDirectionStyle,
  t,
  tCategory,
}: BudgetsTabProps) {
  return (
    <View>
      <Text style={{ textAlign: textAlignment }} className="text-lg font-bold text-text mb-4 px-2">
        {t('analytics.budgets')}
      </Text>

      {budgetProgress.length === 0 ? (
        <View className="mb-6">
          <Card>
            <View className="items-center py-6">
              <Ionicons name="wallet-outline" size={48} color="#64748B" />
              <Text className="text-text-muted mt-4 mb-4 text-center">
                You haven&apos;t set any budgets yet. Track your spending by setting a limit for your categories.
              </Text>
            </View>
          </Card>
        </View>
      ) : (
        <View className="gap-4 mb-6">
          {budgetProgress.map((bp) => (
            <View key={bp.categoryId}>
              <Card>
                <View>
                  <View style={{ flexDirection: flexDirectionStyle }} className="justify-between mb-2">
                    <View style={{ flexDirection: flexDirectionStyle }} className="items-center">
                      <Ionicons name={bp.icon as any} size={20} color={bp.color} />
                      <Text
                        style={{
                          marginLeft: flexDirectionStyle === 'row-reverse' ? 0 : 8,
                          marginRight: flexDirectionStyle === 'row-reverse' ? 8 : 0,
                        }}
                        className="text-base font-semibold text-text"
                      >
                        {tCategory(bp.categoryId)}
                      </Text>
                    </View>
                    <Text className="text-sm text-text-muted">
                      {formatCurrency(bp.spent)} / {formatCurrency(bp.limit)}
                    </Text>
                  </View>

                  <View className="h-2 w-full bg-border rounded-full overflow-hidden relative">
                    <View
                      className="h-full absolute left-0 top-0 bottom-0 rounded-full"
                      style={{
                        width: `${bp.percentage}%`,
                        backgroundColor: bp.percentage >= 100 ? '#EF4444' : bp.color,
                      }}
                    />
                  </View>

                  {bp.percentage >= 100 && (
                    <Text style={{ textAlign: textAlignment }} className="text-xs text-red-500 mt-2">
                      {t('analytics.budgetWarning')}
                    </Text>
                  )}
                </View>
              </Card>
            </View>
          ))}
        </View>
      )}

      <Card>
        <View style={{ alignItems: textAlignment === 'right' ? 'flex-end' : 'flex-start' }} className="border border-border/50 p-4">
          <Text className="font-bold text-text mb-4">{t('analytics.budgetTracking')}</Text>
          <View style={{ flexDirection: flexDirectionStyle }} className="flex-wrap">
            {expenseCategories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => onSetBudget(cat.key, 500)}
                style={{ flexDirection: flexDirectionStyle }}
                className="bg-card px-3 py-2 rounded-full border border-border mr-2 mb-2 items-center"
              >
                <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                <Text
                  style={{
                    marginLeft: flexDirectionStyle === 'row-reverse' ? 0 : 4,
                    marginRight: flexDirectionStyle === 'row-reverse' ? 4 : 0,
                  }}
                  className="text-xs text-text"
                >
                  {tCategory(cat.key)} 500
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );
});

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { t, tCategory, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const transactions = useWorkspaceTransactions();
  const budgets = useBudgetStore((state) => state.budgets);
  const setBudget = useBudgetStore((state) => state.setBudget);

  const currentMonthKey = getMonthKey(new Date());
  const currentYear = new Date().getFullYear();

  const pieData = useMemo(
    () => getCategoryBreakdown(transactions, currentMonthKey),
    [transactions, currentMonthKey],
  );

  const barData = useMemo(
    () => getMonthlyTrends(transactions, currentYear),
    [transactions, currentYear],
  );

  const budgetProgress = useMemo(
    () => getBudgetProgress(transactions, budgets, currentMonthKey),
    [transactions, budgets, currentMonthKey],
  );

  const totalSpending = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData],
  );

  const expenseCategories = useMemo(() => getCategoriesByType('expense'), []);

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }} className="px-6 py-4">
        <Text className="text-2xl font-bold text-text">{t('analytics.title')}</Text>
      </View>

      <View className="px-4 mb-4">
        <View style={{ flexDirection: flexDirectionStyle }} className="bg-card rounded-xl p-1">
          {(['overview', 'trends', 'budgets'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 items-center py-2 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
            >
              <Text className={`font-semibold capitalize ${activeTab === tab ? 'text-white' : 'text-text-muted'}`}>
                {tab === 'overview'
                  ? t('common.all', 'Overview')
                  : tab === 'trends'
                    ? t('analytics.spendingTrends')
                    : t('analytics.budgets')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {activeTab === 'overview' && (
          <AnalyticsOverviewTab
            pieData={pieData}
            totalSpending={totalSpending}
            textAlignment={textAlignment}
            flexDirectionStyle={flexDirectionStyle}
            t={t}
            tCategory={tCategory}
          />
        )}

        {activeTab === 'trends' && (
          <AnalyticsTrendsTab
            barData={barData}
            currentYear={currentYear}
            textAlignment={textAlignment}
            flexDirectionStyle={flexDirectionStyle}
            t={t}
          />
        )}

        {activeTab === 'budgets' && (
          <AnalyticsBudgetsTab
            budgetProgress={budgetProgress}
            expenseCategories={expenseCategories}
            onSetBudget={setBudget}
            textAlignment={textAlignment}
            flexDirectionStyle={flexDirectionStyle}
            t={t}
            tCategory={tCategory}
          />
        )}
      </ScrollView>
    </View>
  );
}
