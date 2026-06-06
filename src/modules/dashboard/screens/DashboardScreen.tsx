import React, { useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { AppText as Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { useGlobalBalance, useMonthlyStats, useWorkspaceTransactions } from '@/modules/transactions/store/useTransactionStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { getMonthKey, formatCurrency } from '@/utils/helpers';
import { RecentTransactionItem } from '@/modules/dashboard/components/RecentTransactionItem';
import { spacing } from '@/theme/spacing';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  
  // Workspace integration
  const [showSelector, setShowSelector] = useState(false);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const userRole = useWorkspaceStore((state) => {
    if (!state.activeWorkspaceId) return 'admin';
    const currentWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    const authUser = useAuthStore.getState().user;
    const currentUserId = authUser?.id || 'guest_user_id';
    const member = currentWorkspace?.members.find((m) => m.id === currentUserId);
    return member?.role || 'viewer';
  });

  // Data selectors (automatically workspace-aware)
  const { balance } = useGlobalBalance();
  const currentMonthKey = getMonthKey(new Date());
  const { totalIncome, totalExpense } = useMonthlyStats(currentMonthKey);
  const transactions = useWorkspaceTransactions();

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  // Generate mini trend data (last 7 days of expenses)
  const trendData = useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] || '';
      
      const dayTotal = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);
      
      data.push({ value: dayTotal || 0 });
    }
    return data;
  }, [transactions]);

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={styles.header} className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity 
          onPress={() => setShowSelector(true)}
          activeOpacity={0.7}
          style={{ flexDirection: flexDirectionStyle, alignItems: 'center' }}
        >
          <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <View style={{ flexDirection: flexDirectionStyle, alignItems: 'center' }}>
              <Text className="text-xs text-text-muted mr-1">
                {t('dashboard.workspaceBalance', 'Active Ledger')}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: flexDirectionStyle, alignItems: 'center', marginTop: 2 }}>
              <Text className="text-xl font-bold text-text">
                {activeWorkspaceId ? activeWorkspace?.name : t('dashboard.personalAccount', 'Personal Account')}
              </Text>
              {userRole === 'viewer' && (
                <View className="ml-2 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] text-amber-500 font-bold uppercase">
                    {t('workspaces.roleViewer', 'Viewer')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          {/* <IconButton 
            icon="scan-outline" 
            onPress={() => navigation.navigate('Scanner')} 
            backgroundColor="transparent"
          /> */}
          <IconButton 
            icon="settings-outline" 
            onPress={() => navigation.navigate('Settings')} 
            backgroundColor="transparent"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Main Balance Card */}
        <View className="mb-6">
          <Card>
            <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text className="text-sm font-medium text-text-muted mb-1">{t('dashboard.balance')}</Text>
              <Text className="text-4xl font-extrabold text-text tracking-tight mb-6">
                {formatCurrency(balance)}
              </Text>
              
              <View className="flex-row justify-between w-full pt-4 border-t border-border/30" style={{ flexDirection: flexDirectionStyle }}>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <View style={{ flexDirection: flexDirectionStyle, alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="arrow-down-circle" size={16} color="#10B981" />
                    <Text style={{ marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }} className="text-xs text-text-muted">
                      {t('dashboard.income')}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-text">{formatCurrency(totalIncome)}</Text>
                </View>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <View style={{ flexDirection: flexDirectionStyle, alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="arrow-up-circle" size={16} color="#EF4444" />
                    <Text style={{ marginLeft: isRTL ? 0 : 4, marginRight: isRTL ? 4 : 0 }} className="text-xs text-text-muted">
                      {t('dashboard.expense')}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-text">{formatCurrency(totalExpense)}</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Mini Spend Trend */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-2 mb-4" style={{ flexDirection: flexDirectionStyle }}>
            <Text className="text-lg font-bold text-text">{t('analytics.spendingTrends')}</Text>
            <Badge label={t('analytics.last7Days', 'Last 7 Days')} variant="secondary" />
          </View>
          
          <Card>
            <View className="items-center justify-center">
              {trendData.every(d => d.value === 0) ? (
                <View className="h-32 justify-center items-center">
                  <Text className="text-text-muted">{t('analytics.noTrendData', 'No expenses in the last 7 days')}</Text>
                </View>
              ) : (
                <LineChart
                  data={trendData}
                  height={120}
                  width={280}
                  thickness={3}
                  color="#8B5CF6" // Purple
                  hideDataPoints
                  hideAxesAndRules
                  hideYAxisText
                  curveType={1} // smooth curve
                  startFillColor="#8B5CF6"
                  endFillColor="#8B5CF6"
                  startOpacity={0.2}
                  endOpacity={0}
                  areaChart
                />
              )}
            </View>
          </Card>
        </View>

        {/* Recent Transactions */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-2 mb-4" style={{ flexDirection: flexDirectionStyle }}>
            <Text className="text-lg font-bold text-text">{t('dashboard.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text className="text-sm font-medium text-primary">{t('dashboard.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length === 0 ? (
            <Card>
              <View className="items-center py-6">
                <Text className="text-text-muted">{t('common.noData')}</Text>
              </View>
            </Card>
          ) : (
            <View className="gap-3">
              {recentTransactions.map((tx) => (
                <RecentTransactionItem
                  key={tx.id}
                  transaction={tx}
                  flexDirectionStyle={flexDirectionStyle}
                  isRTL={isRTL}
                  typeLabel={t(`transactions.${tx.type}`)}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Workspace Selector Bottom Sheet Modal */}
      <Modal visible={showSelector} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setShowSelector(false)} 
          />
          <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHeader, { flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {t('workspaces.switchWorkspace', 'Switch Workspace')}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowSelector(false);
                  navigation.navigate('WorkspaceManager');
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('common.edit', 'Manage')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {/* Personal Account Row */}
              <TouchableOpacity
                onPress={() => {
                  useWorkspaceStore.getState().setActiveWorkspaceId(null);
                  setShowSelector(false);
                }}
                style={[
                  styles.workspaceRow,
                  { flexDirection: flexDirectionStyle },
                  !activeWorkspaceId && { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }
                ]}
              >
                <View style={styles.workspaceIconContainer}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.workspaceName, { color: colors.text }]}>
                    {t('dashboard.personalAccount', 'Personal Account')}
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                    {t('dashboard.localPrivate', 'Local & Private')}
                  </Text>
                </View>
                {!activeWorkspaceId && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Workspace Rows */}
              {workspaces.map((w) => {
                const isActive = activeWorkspaceId === w.id;
                const userMember = w.members.find(m => m.id === (useAuthStore.getState().user?.id || 'guest_user_id'));
                const roleLabel = userMember?.role || 'viewer';

                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      useWorkspaceStore.getState().setActiveWorkspaceId(w.id);
                      setShowSelector(false);
                    }}
                    style={[
                      styles.workspaceRow,
                      { flexDirection: flexDirectionStyle },
                      isActive && { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }
                    ]}
                  >
                    <View style={[styles.workspaceIconContainer, { backgroundColor: `${colors.transfer}15` }]}>
                      <Ionicons name="people" size={20} color={colors.transfer} />
                    </View>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.workspaceName, { color: colors.text }]}>{w.name}</Text>
                      <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: textAlignment }}>
                        {w.members.length} {t('workspaces.members', 'Members')} • {t('workspaces.role', 'Role')}: {t(`workspaces.role${roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)}`)}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => {
                setShowSelector(false);
                navigation.navigate('WorkspaceManager');
              }}
              style={[styles.createBtn, { backgroundColor: colors.primary, flexDirection: flexDirectionStyle }]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>
                {t('workspaces.createWorkspace')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  sheetHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  workspaceRow: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
    gap: 12,
  },
  workspaceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workspaceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  createBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
