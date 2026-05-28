/**
 * TransactionDetailScreen — Full details overview of a single ledger item
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenWrapper } from '@/components/layouts';
import { Card, Button, Badge } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransactionStore } from '../store/useTransactionStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { getCategoryDetails } from '../utils/categories';
import { formatCurrency, formatDate } from '@/utils/helpers';
import type { RootStackParamList } from '@/navigation/types';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';

type DetailRouteProp = RouteProp<RootStackParamList, 'TransactionDetail'>;

export function TransactionDetailScreen() {
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<DetailRouteProp>();
  const { id } = route.params;

  const { transactions, deleteTransaction } = useTransactionStore();
  const tx = transactions.find((t) => t.id === id);

  const userRole = useWorkspaceStore((state) => {
    if (!state.activeWorkspaceId) return 'admin';
    const currentWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    const authUser = useAuthStore.getState().user;
    const currentUserId = authUser?.id || 'guest_user_id';
    const member = currentWorkspace?.members.find((m) => m.id === currentUserId);
    return member?.role || 'viewer';
  });

  // Attachment Modal State
  const [activeImage, setActiveImage] = useState<string | null>(null);

  if (!tx) {
    return (
      <ScreenWrapper style={{ backgroundColor: colors.background }}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>{t('common.error')}</Text>
          <Button title={t('common.back')} onPress={() => navigation.goBack()} variant="primary" style={{ marginTop: spacing.lg }} />
        </View>
      </ScreenWrapper>
    );
  }

  const cat = getCategoryDetails(tx.category);
  const formattedAmt = formatCurrency(tx.amount);
  
  let amtColor = colors.text;
  let typeLabel = '';
  if (tx.type === 'income') {
    amtColor = colors.income;
    typeLabel = t('transactions.income');
  } else if (tx.type === 'expense') {
    amtColor = colors.expense;
    typeLabel = t('transactions.expense');
  } else if (tx.type === 'transfer') {
    amtColor = colors.transfer;
    typeLabel = t('transactions.transfer');
  }

  const handleDelete = () => {
    Alert.alert(
      t('common.delete', 'Delete Record'),
      t('transactions.deleteConfirm', 'Are you sure you want to permanently remove this transaction?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', { transactionId: tx.id });
  };

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      {/* Top Header */}
      <View style={[styles.header, { flexDirection: flexDirectionStyle }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('transactions.details')}</Text>
        {userRole !== 'viewer' ? (
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {userRole === 'viewer' && (
          <View 
            style={[
              styles.readOnlyWarning, 
              { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}30`, flexDirection: flexDirectionStyle }
            ]}
          >
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600', flex: 1, textAlign: textAlignment }}>
              {t('workspaces.roleViewer')}: Read-Only mode active.
            </Text>
          </View>
        )}
        {/* Massive Amount Display Section */}
        <View style={styles.amountSection}>
          <View style={[styles.catCircle, { backgroundColor: `${cat.color}15` }]}>
            <Ionicons name={cat.icon as any} size={28} color={cat.color} />
          </View>
          <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>{typeLabel}</Text>
          <Text style={[styles.amountText, { color: amtColor }]}>
            {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
            {formattedAmt}
          </Text>
          <Text style={[styles.txTitle, { color: colors.text }]}>{tx.title}</Text>
          <Text style={[styles.txDate, { color: colors.textTertiary }]}>
            {formatDate(tx.date, 'long')} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Transfer pathway */}
        {tx.type === 'transfer' && (
          <Card style={[styles.detailCard, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('transactions.transfer').toUpperCase()}
            </Text>
            <View style={[styles.pathwayRow, { flexDirection: flexDirectionStyle }]}>
              <View style={styles.pathwayBox}>
                <Ionicons name="wallet-outline" size={24} color={colors.transfer} />
                <Text style={[styles.pathwayAccount, { color: colors.text }]}>{tx.fromAccount || 'Cash Wallet'}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 10 }}>SENDER</Text>
              </View>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={24} color={colors.textSecondary} style={{ marginHorizontal: spacing.sm }} />
              <View style={styles.pathwayBox}>
                <Ionicons name="business-outline" size={24} color={colors.primary} />
                <Text style={[styles.pathwayAccount, { color: colors.text }]}>{tx.toAccount || 'Main Bank'}</Text>
                <Text style={{ color: colors.textTertiary, fontSize: 10 }}>RECEIVER</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Category Details */}
        <Card style={[styles.detailCard, { borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
            {t('transactions.category').toUpperCase()}
          </Text>
          <View style={[styles.categoryInfoRow, { flexDirection: flexDirectionStyle }]}>
            <View 
              style={[
                styles.iconBox, 
                { backgroundColor: `${cat.color}15`, marginRight: isRTL ? 0 : spacing.md, marginLeft: isRTL ? spacing.md : 0 }
              ]}
            >
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
            </View>
            <Text style={[styles.categoryName, { color: colors.text }]}>{tCategory(tx.category)}</Text>
          </View>

          {tx.tags && tx.tags.length > 0 && (
            <View style={[styles.tagsWrapper, { flexDirection: flexDirectionStyle }]}>
              {tx.tags.map((tag) => (
                <Badge key={tag} label={`#${tag}`} variant="secondary" />
              ))}
            </View>
          )}
        </Card>

        {/* Splits Details (Expenses Only) */}
        {tx.type === 'expense' && tx.splitDetails && tx.splitDetails.length > 0 && (
          <Card style={[styles.detailCard, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('transactions.expense').toUpperCase()} SPLITS
            </Text>
            <View style={styles.splitsList}>
              {tx.splitDetails.map((split) => (
                <View key={split.id} style={[styles.splitRow, { flexDirection: flexDirectionStyle }]}>
                  <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                    <Ionicons 
                      name="person-outline" 
                      size={16} 
                      color={colors.textSecondary} 
                      style={{ marginRight: isRTL ? 0 : spacing.xs, marginLeft: isRTL ? spacing.xs : 0 }} 
                    />
                    <Text style={[styles.splitName, { color: colors.text }]}>{split.name}</Text>
                  </View>
                  <Text style={[styles.splitAmt, { color: colors.expense }]}>
                    {formatCurrency(split.amount)}
                  </Text>
                </View>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={[styles.splitSummary, { flexDirection: flexDirectionStyle }]}>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Total Shared:</Text>
                <Text style={[styles.splitTotal, { color: colors.text }]}>
                  {formatCurrency(tx.splitDetails.reduce((acc, curr) => acc + curr.amount, 0))}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recurring rule configuration */}
        {tx.recurring && tx.recurrenceRule && (
          <Card style={[styles.detailCard, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('settings.displayTheme', 'Recurring').toUpperCase()}
            </Text>
            <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
              <Ionicons 
                name="repeat-outline" 
                size={20} 
                color={colors.primary} 
                style={{ marginRight: isRTL ? 0 : spacing.sm, marginLeft: isRTL ? spacing.sm : 0 }} 
              />
              <Text style={{ color: colors.text, fontWeight: '500' }}>
                Repeats every {tx.recurrenceRule.interval > 1 ? `${tx.recurrenceRule.interval} ` : ''}
                {tx.recurrenceRule.frequency}
              </Text>
            </View>
          </Card>
        )}

        {/* Notes / Memo Card */}
        {tx.note && (
          <Card style={[styles.detailCard, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('transactions.notes').toUpperCase()}
            </Text>
            <Text style={[styles.noteText, { color: colors.text, textAlign: textAlignment }]}>{tx.note}</Text>
          </Card>
        )}

        {/* Attachments Card */}
        {tx.attachments && tx.attachments.length > 0 && (
          <Card style={[styles.detailCard, { borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('transactions.receipt').toUpperCase()}
            </Text>
            <View style={[styles.attachmentsGrid, { flexDirection: flexDirectionStyle }]}>
              {tx.attachments.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveImage(uri)}
                  style={[styles.attachmentThumb, { borderColor: colors.border }]}
                >
                  <Image source={{ uri }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Delete Record Button */}
        {userRole !== 'viewer' && (
          <Button
            title={t('common.delete')}
            onPress={handleDelete}
            variant="danger"
            size="md"
            fullWidth
            style={styles.deleteBtn}
          />
        )}
      </ScrollView>

      {/* Full-screen Image Attachment Viewer Modal */}
      <Modal visible={!!activeImage} transparent animationType="fade">
        <View style={[styles.imgModalOverlay, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <TouchableOpacity onPress={() => setActiveImage(null)} style={styles.imgModalClose}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          {activeImage && (
            <Image source={{ uri: activeImage }} style={styles.imgModalView} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  readOnlyWarning: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  catCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: fontSize['4xl'] + 4,
    fontWeight: fontWeight.extrabold,
    marginVertical: spacing.xs,
  },
  txTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  txDate: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.xs - 2,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  pathwayRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathwayBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
  },
  pathwayAccount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 4,
  },
  row: {
    alignItems: 'center',
  },
  categoryInfoRow: {
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  tagsWrapper: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  splitsList: {
    marginTop: spacing.xs,
  },
  splitRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  splitName: {
    fontSize: fontSize.sm,
  },
  splitAmt: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  splitSummary: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitTotal: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  noteText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  attachmentsGrid: {
    gap: spacing.sm,
  },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  imgModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgModalClose: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
  },
  imgModalView: {
    width: '90%',
    height: '80%',
  },
});
