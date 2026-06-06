/**
 * TransactionsScreen — real ledger screen for Phase 4
 * Displays income, expenses, and transfers grouped by date.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layouts';
import { Input, Button, Card, Badge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransactionStore, useUniqueTags, useWorkspaceTransactions } from '../store/useTransactionStore';
import { TransactionListItem } from '../components/TransactionListItem';
import { formatCurrency, formatDate } from '@/utils/helpers';
import type { Transaction, TransactionType, CategoryType } from '@/types/transaction';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { useDebounce } from '@/hooks/useDebounce';

interface TransactionSection {
  title: string; // Date string
  data: Transaction[];
  netAmount: number;
}

export function TransactionsScreen() {
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  const navigation = useNavigation<any>();
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const workspaceTransactions = useWorkspaceTransactions();

  const workspaces = useWorkspaceStore((state) => state.workspaces);

  const userRole = useWorkspaceStore((state) => {
    if (!state.activeWorkspaceId) return 'admin';
    const currentWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    const authUser = useAuthStore.getState().user;
    const currentUserId = authUser?.id || 'guest_user_id';
    const member = currentWorkspace?.members.find((m) => m.id === currentUserId);
    return member?.role || 'viewer';
  });

  const uniqueTags = useUniqueTags();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Modals Visibility
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return workspaceTransactions.filter((tx) => {
      // 1. Search Query (debounced for performance)
      const query = debouncedSearchQuery.trim().toLowerCase();
      if (query) {
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesNote = tx.note?.toLowerCase().includes(query) || false;
        const matchesTags = tx.tags?.some((t) => t.toLowerCase().includes(query)) || false;
        if (!matchesTitle && !matchesNote && !matchesTags) return false;
      }

      // 2. Transaction Type
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // 3. Categories
      if (selectedCategories.length > 0 && !selectedCategories.includes(tx.category)) return false;

      // 4. Tags
      if (selectedTags.length > 0 && !tx.tags?.some((t) => selectedTags.includes(t))) return false;

      // 5. Date Range
      if (dateRange !== 'all') {
        const txDate = new Date(tx.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateRange === 'today') {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === 'week') {
          if (diffDays > 7) return false;
        } else if (dateRange === 'month') {
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [workspaceTransactions, debouncedSearchQuery, filterType, selectedCategories, selectedTags, dateRange]);

  // Group by Date for SectionList
  const sections = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateStr = new Date(tx.date).toDateString();
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr]!.push(tx);
    });

    const list: TransactionSection[] = Object.keys(groups).map((dateStr) => {
      const txs = groups[dateStr]!;
      let netAmount = 0;
      txs.forEach((tx) => {
        if (tx.type === 'income') netAmount += tx.amount;
        if (tx.type === 'expense') netAmount -= tx.amount;
      });

      return {
        title: dateStr,
        data: txs,
        netAmount,
      };
    });

    // Sort sections descending by date
    return list.sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());
  }, [filteredTransactions]);

  // Analytics Metrics for Current Filtered List
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  // Tag Toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setFilterType('all');
    setSelectedCategories([]);
    setSelectedTags([]);
    setDateRange('all');
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      t('common.delete', 'Delete'),
      t('transactions.deleteConfirm', 'Are you sure you want to delete this transaction?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            setSelectedTx(null);
          },
        },
      ]
    );
  };

  // Render Section Header
  const renderSectionHeader = useCallback(({ section }: { section: TransactionSection }) => {
    const formattedDate = formatDate(section.title, 'medium');
    const net = section.netAmount;
    const netFormatted = formatCurrency(net);
    const netColor = net > 0 ? colors.income : net < 0 ? colors.expense : colors.textSecondary;

    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background, flexDirection: flexDirectionStyle }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {formattedDate}
        </Text>
        <Text style={[styles.sectionNet, { color: netColor }]}>
          {net > 0 ? `+${netFormatted}` : netFormatted}
        </Text>
      </View>
    );
  }, [colors, flexDirectionStyle]);

  // Render Transaction Row
  const handleItemPress = useCallback(
    (item: Transaction) => navigation.navigate('TransactionDetail', { id: item.id }),
    [navigation],
  );

  const handleItemLongPress = useCallback((item: Transaction) => {
    setSelectedTx(item);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionListItem
        item={item}
        isRTL={isRTL}
        flexDirectionStyle={flexDirectionStyle}
        onPress={handleItemPress}
        onLongPress={handleItemLongPress}
        tCategory={tCategory}
      />
    ),
    [isRTL, flexDirectionStyle, handleItemPress, handleItemLongPress, tCategory],
  );

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      {/* Top Header Controls */}
      <View style={[styles.topHeader, { flexDirection: flexDirectionStyle }]}>
        <View style={{ flexDirection: flexDirectionStyle, alignItems: 'center', gap: spacing.sm }}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>{t('transactions.title')}</Text>
          {userRole === 'viewer' && (
            <Badge label={t('workspaces.roleViewer')} variant="warning" />
          )}
        </View>
      </View>

      {/* Metrics Card */}
      <Card style={[styles.metricsContainer, { backgroundColor: colors.surface, flexDirection: flexDirectionStyle }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('transactions.income').toUpperCase()}</Text>
          <Text style={[styles.metricValue, { color: colors.income }]}>{formatCurrency(metrics.income)}</Text>
        </View>
        <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('transactions.expense').toUpperCase()}</Text>
          <Text style={[styles.metricValue, { color: colors.expense }]}>{formatCurrency(metrics.expense)}</Text>
        </View>
      </Card>

      {/* Search & Filter Bar */}
      <View style={[styles.searchBarRow, { flexDirection: flexDirectionStyle }]}>
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={colors.textTertiary} />}
          containerStyle={{ flex: 1, marginBottom: 0 }}
        />
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={[styles.filterButton, { borderColor: colors.border }]}
        >
          <Ionicons name="filter-outline" size={20} color={colors.textSecondary} />
          {(selectedCategories.length > 0 || selectedTags.length > 0 || dateRange !== 'all' || filterType !== 'all') && (
            <View style={[styles.activeFilterDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Ledger List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('common.noData')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {t('common.noData')}
            </Text>
          </View>
        }
      />

      {/* Advanced Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('common.actions', 'Filters')}</Text>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('settings.signOutConfirm', 'Clear All')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Type Filter */}
              <Text style={[styles.filterGroupTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.type')}</Text>
              <View style={[styles.segmentedRow, { flexDirection: flexDirectionStyle }]}>
                {(['all', 'income', 'expense', 'transfer'] as const).map((tType) => {
                  const isSelected = filterType === tType;
                  return (
                    <TouchableOpacity
                      key={tType}
                      onPress={() => setFilterType(tType)}
                      style={[
                        styles.segmentBtn,
                        { borderColor: colors.border },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#FFFFFF' : colors.text, fontSize: 10 }}>
                        {tType === 'all' ? t('common.all').toUpperCase() : t(`transactions.${tType}`).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Range */}
              <Text style={[styles.filterGroupTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.date')}</Text>
              <View style={[styles.segmentedRow, { flexDirection: flexDirectionStyle }]}>
                {(['all', 'today', 'week', 'month'] as const).map((r) => {
                  const isSelected = dateRange === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setDateRange(r)}
                      style={[
                        styles.segmentBtn,
                        { borderColor: colors.border },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={{ color: isSelected ? '#FFFFFF' : colors.text, fontSize: 10 }}>
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Unique Tags Checklist */}
              {uniqueTags.length > 0 && (
                <>
                  <Text style={[styles.filterGroupTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.tags')}</Text>
                  <View style={[styles.tagsContainer, { flexDirection: flexDirectionStyle }]}>
                    {uniqueTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => toggleTag(tag)}
                          style={[
                            styles.tagChip,
                            { borderColor: colors.border },
                            isSelected && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                          ]}
                        >
                          <Text style={{ color: isSelected ? colors.primary : colors.textSecondary }}>
                            #{tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            <Button title={t('common.submit', 'Apply Filters')} onPress={() => setShowFilterModal(false)} variant="primary" fullWidth style={styles.modalApplyBtn} />
          </View>
        </View>
      </Modal>

      {/* Long Press Transaction Options Modal */}
      <Modal visible={!!selectedTx} animationType="fade" transparent>
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setSelectedTx(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedTx?.title}
            </Text>
            <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg }}>
              {selectedTx ? formatDate(selectedTx.date, 'long') : ''}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (selectedTx) {
                  navigation.navigate('TransactionDetail', { id: selectedTx.id });
                  setSelectedTx(null);
                }
              }}
              style={[styles.actionRow, { flexDirection: flexDirectionStyle }]}
            >
              <Ionicons name="eye-outline" size={20} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text, marginLeft: isRTL ? 0 : spacing.lg, marginRight: isRTL ? spacing.lg : 0 }]}>
                {t('transactions.details', 'View Details')}
              </Text>
            </TouchableOpacity>

            {userRole !== 'viewer' && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedTx) {
                      navigation.navigate('AddTransaction', { transactionId: selectedTx.id });
                      setSelectedTx(null);
                    }
                  }}
                  style={[styles.actionRow, { flexDirection: flexDirectionStyle }]}
                >
                  <Ionicons name="create-outline" size={20} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text, marginLeft: isRTL ? 0 : spacing.lg, marginRight: isRTL ? spacing.lg : 0 }]}>
                    {t('common.edit', 'Edit Record')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (selectedTx) handleDeletePress(selectedTx.id);
                  }}
                  style={[styles.actionRow, { borderBottomWidth: 0, flexDirection: flexDirectionStyle }]}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error, marginLeft: isRTL ? 0 : spacing.lg, marginRight: isRTL ? spacing.lg : 0 }]}>
                    {t('common.delete', 'Delete Record')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  metricsContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fontSize.xs - 2,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  searchBarRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    height: 48,
    width: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  sectionNet: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing['2xl'],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '85%',
    padding: spacing.xl,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalScroll: {
    paddingBottom: spacing.xl,
  },
  filterGroupTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentedRow: {
    gap: spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tagsContainer: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    borderWidth: 1.5,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalApplyBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  actionSheet: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  actionSheetTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#33415520',
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
