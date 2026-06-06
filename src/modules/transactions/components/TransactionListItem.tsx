import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { getCategoryDetails } from '../utils/categories';
import { formatCurrency } from '@/utils/helpers';
import type { Transaction } from '@/types/transaction';
import { spacing } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';

interface TransactionListItemProps {
  item: Transaction;
  isRTL: boolean;
  flexDirectionStyle: 'row' | 'row-reverse';
  onPress: (item: Transaction) => void;
  onLongPress: (item: Transaction) => void;
  tCategory: (category: string) => string;
}

export const TransactionListItem = memo(function TransactionListItem({
  item,
  isRTL,
  flexDirectionStyle,
  onPress,
  onLongPress,
  tCategory,
}: TransactionListItemProps) {
  const { colors } = useTheme();
  const cat = getCategoryDetails(item.category);
  const formattedAmt = formatCurrency(item.amount);

  let sign = '';
  let amtColor = colors.text;
  if (item.type === 'income') {
    sign = '+';
    amtColor = colors.income;
  } else if (item.type === 'expense') {
    sign = '-';
    amtColor = colors.expense;
  } else if (item.type === 'transfer') {
    amtColor = colors.transfer;
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
      style={[
        styles.rowCard,
        { backgroundColor: colors.card, borderBottomColor: colors.border, flexDirection: flexDirectionStyle },
      ]}
    >
      <View style={[styles.leftRow, { flexDirection: flexDirectionStyle }]}>
        <View
          style={[
            styles.categoryCircle,
            {
              backgroundColor: `${cat.color}15`,
              marginRight: isRTL ? 0 : spacing.md,
              marginLeft: isRTL ? spacing.md : 0,
            },
          ]}
        >
          <Ionicons name={cat.icon as any} size={20} color={cat.color} />
        </View>
        <View style={[styles.textColumn, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.metadataIndicators, { flexDirection: flexDirectionStyle }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{tCategory(item.category)}</Text>

            {item.recurring && (
              <Ionicons name="repeat" size={12} color={colors.primary} style={{ marginHorizontal: spacing.xs }} />
            )}
            {item.attachments && item.attachments.length > 0 && (
              <Ionicons name="attach" size={12} color={colors.info} style={{ marginHorizontal: spacing.xs }} />
            )}
            {item.splitDetails && item.splitDetails.length > 0 && (
              <Ionicons name="people" size={12} color={colors.warning} style={{ marginHorizontal: spacing.xs }} />
            )}
          </View>
        </View>
      </View>

      <View style={[styles.rightRow, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
        <Text style={[styles.rowAmount, { color: amtColor }]}>
          {sign}{formattedAmt}
        </Text>
        {item.type === 'transfer' && (
          <Text style={[styles.transferLabel, { color: colors.textTertiary }]}>
            {item.fromAccount} → {item.toAccount}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  rowCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  leftRow: {
    alignItems: 'center',
    flex: 1,
  },
  categoryCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  metadataIndicators: {
    alignItems: 'center',
    marginTop: 2,
  },
  rightRow: {
    minWidth: 70,
  },
  rowAmount: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
  },
  transferLabel: {
    fontSize: fontSize.xs - 2,
    marginTop: 2,
  },
});
