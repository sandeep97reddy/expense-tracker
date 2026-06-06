import React, { memo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { getCategoryDetails } from '@/modules/transactions/utils/categories';
import { formatCurrency } from '@/utils/helpers';
import type { Transaction } from '@/types/transaction';

interface RecentTransactionItemProps {
  transaction: Transaction;
  flexDirectionStyle: 'row' | 'row-reverse';
  isRTL: boolean;
  typeLabel: string;
}

export const RecentTransactionItem = memo(function RecentTransactionItem({
  transaction,
  flexDirectionStyle,
  isRTL,
  typeLabel,
}: RecentTransactionItemProps) {
  const details = getCategoryDetails(transaction.category);

  return (
    <Card>
      <View className="flex-row items-center" style={{ flexDirection: flexDirectionStyle }}>
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{
            backgroundColor: `${details.color}20`,
            marginRight: isRTL ? 0 : 16,
            marginLeft: isRTL ? 16 : 0,
          }}
        >
          <Ionicons name={details.icon as any} size={24} color={details.color} />
        </View>
        <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text className="text-base font-bold text-text mb-1">{transaction.title}</Text>
          <Text className="text-xs text-text-muted">{new Date(transaction.date).toLocaleDateString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            className={`text-base font-bold ${
              transaction.type === 'income'
                ? 'text-green-500'
                : transaction.type === 'expense'
                  ? 'text-red-500'
                  : 'text-text'
            }`}
          >
            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text className="text-xs text-text-muted uppercase mt-1">{typeLabel}</Text>
        </View>
      </View>
    </Card>
  );
});
