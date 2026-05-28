/**
 * AddTransactionScreen — handles creating and editing transactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ScreenWrapper, KeyboardAvoidingWrapper } from '@/components/layouts';
import { Button, Input, Card, Badge, IconButton } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { notificationService } from '@/services/notifications/notificationService';
import { getCategoriesByType, getCategoryDetails } from '../utils/categories';
import type { RootStackParamList } from '@/navigation/types';
import type { CategoryType, TransactionType, SplitDetail, RecurrenceRule } from '@/types/transaction';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';
import { formatDate } from '@/utils/helpers';

type AddTransactionRouteProp = RouteProp<RootStackParamList, 'AddTransaction'>;

export function AddTransactionScreen() {
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<AddTransactionRouteProp>();
  
  const transactionId = route.params?.transactionId;
  const initialType = route.params?.type || 'expense';

  const { transactions, addTransaction, updateTransaction } = useTransactionStore();

  // Workspace active selectors
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activeWorkspaceName = activeWorkspace?.name || null;

  // App settings store (currency)
  const activeCurrency = useAppStore((state) => state.currency);
  const currencySymbol = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
    CNY: '¥',
  }[activeCurrency] || '₹';

  const userRole = useWorkspaceStore((state) => {
    if (!state.activeWorkspaceId) return 'admin';
    const currentWorkspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    const authUser = useAuthStore.getState().user;
    const currentUserId = authUser?.id || 'guest_user_id';
    const member = currentWorkspace?.members.find((m) => m.id === currentUserId);
    return member?.role || 'viewer';
  });

  // Viewer check security block
  useEffect(() => {
    if (userRole === 'viewer') {
      Alert.alert(t('workspaces.roleViewer'), t('workspaces.roleViewer'));
      navigation.goBack();
    }
  }, [userRole, navigation]);

  // State Fields
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [attachments, setAttachments] = useState<string[]>([]);

  // Custom Category State
  const addCustomCategory = useCategoryStore((state) => state.addCustomCategory);
  const [showCustomCatModal, setShowCustomCatModal] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatIcon, setCustomCatIcon] = useState('star'); // default Ionicons icon
  
  // Grid Expansion State
  const [isExpanded, setIsExpanded] = useState(false);

  // Split Expense State (Expense Only)
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splits, setSplits] = useState<SplitDetail[]>([]);
  const [splitName, setSplitName] = useState<string>('');
  const [splitAmount, setSplitAmount] = useState<string>('');

  // Recurring State
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    frequency: 'monthly',
    interval: 1,
  });

  // Transfer State (Transfer Only)
  const [fromAccount, setFromAccount] = useState<string>('Cash Wallet');
  const [toAccount, setToAccount] = useState<string>('Main Bank');

  // Load transaction if editing
  useEffect(() => {
    if (transactionId) {
      const tx = transactions.find((t) => t.id === transactionId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setTitle(tx.title);
        setCategory(tx.category);
        setDate(new Date(tx.date));
        setNote(tx.note || '');
        setAttachments(tx.attachments || []);
        
        if (tx.splitDetails && tx.splitDetails.length > 0) {
          setIsSplit(true);
          setSplits(tx.splitDetails);
        }
        if (tx.recurring && tx.recurrenceRule) {
          setIsRecurring(true);
          setRecurrenceRule(tx.recurrenceRule);
        }
        if (tx.fromAccount) setFromAccount(tx.fromAccount);
        if (tx.toAccount) setToAccount(tx.toAccount);
      }
    }
  }, [transactionId, transactions]);

  // Set default category when type changes
  useEffect(() => {
    if (!transactionId) {
      const available = getCategoriesByType(type);
      if (available.length > 0) {
        setCategory(available[0]!.key);
      }
    }
  }, [type, transactionId]);

  // Image Picking Handler
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error'), t('upi.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const tempUri = result.assets[0].uri;
      try {
        // Copy to persistent document directory
        const fileName = tempUri.split('/').pop();
        const persistentUri = `${FileSystem.documentDirectory}${Date.now()}_${fileName}`;
        await FileSystem.copyAsync({ from: tempUri, to: persistentUri });
        setAttachments((prev) => [...prev, persistentUri]);
      } catch (err) {
        console.error('Failed to save receipt image:', err);
        Alert.alert(t('common.error'), 'Failed to persist receipt image.');
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Custom Category Helper
  const handleAddCustomCategory = () => {
    if (!customCatName.trim()) return;
    addCustomCategory({
      label: customCatName.trim(),
      icon: customCatIcon,
      color: colors.primary,
      type,
    });
    setShowCustomCatModal(false);
    setCustomCatName('');
  };

  // Split Helpers
  const handleAddSplit = () => {
    const name = splitName.trim();
    const val = parseFloat(splitAmount);
    if (!name || isNaN(val) || val <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid name and amount.');
      return;
    }

    const newSplit: SplitDetail = {
      id: Math.random().toString(),
      name,
      amount: val,
      isPaid: false,
    };

    setSplits((prev) => [...prev, newSplit]);
    setSplitName('');
    setSplitAmount('');
  };

  const handleRemoveSplit = (id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id));
  };

  // Save Handler
  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('transactions.amountPositive'));
      return;
    }

    const totalSplitAmt = splits.reduce((acc, curr) => acc + curr.amount, 0);
    if (isSplit && totalSplitAmt > parsedAmount) {
      Alert.alert(t('common.error'), 'Sum of splits cannot exceed the total transaction amount.');
      return;
    }

    const txData = {
      amount: parsedAmount,
      type,
      category,
      title: title.trim() || tCategory(category) || 'Transaction',
      note: note.trim() || undefined,
      date: date.toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      recurring: isRecurring ? true : undefined,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      fromAccount: type === 'transfer' ? fromAccount : undefined,
      toAccount: type === 'transfer' ? toAccount : undefined,
      splitDetails: type === 'expense' && isSplit && splits.length > 0 ? splits : undefined,
    };

    if (transactionId) {
      updateTransaction(transactionId, txData);
    } else {
      addTransaction(txData);

      // --- Budget Alert Check ---
      const appState = useAppStore.getState();
      if (appState.budgetAlertsEnabled && type === 'expense' && parsedAmount > 5000) {
        notificationService.scheduleLocalNotification(
          t('notifications.budgetAlertTitle') || 'Budget Alert ⚠️',
          t('notifications.budgetAlertBody') || 'You have exceeded your budget for this category.'
        );
      }
    }

    navigation.goBack();
  };

  const categoryDetails = getCategoriesByType(type);
  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingWrapper>
        <View style={[styles.header, { flexDirection: flexDirectionStyle }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {transactionId ? t('transactions.editTransaction') : t('transactions.addTransaction')}
            </Text>
            {activeWorkspaceName && (
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 }}>
                {t('transactions.workspace').toUpperCase()}: {activeWorkspaceName.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Amount Display Card */}
          <Card style={[styles.amountCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>{t('transactions.enterAmount').toUpperCase()}</Text>
            <View style={[styles.amountInputRow, { flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.currencySymbol, { color: colors.text, marginRight: isRTL ? 0 : spacing.xs, marginLeft: isRTL ? spacing.xs : 0 }]}>
                {currencySymbol}
              </Text>
              <Input
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={[styles.amountInput, { color: colors.text, textAlign: textAlignment }]}
                containerStyle={{ marginBottom: 0, flex: 1 }}
                maxLength={9}
              />
            </View>
          </Card>

          {/* Type Segmented Slider */}
          <View style={[styles.segmentContainer, { backgroundColor: colors.surface, flexDirection: flexDirectionStyle }]}>
            {(['income', 'expense', 'transfer'] as const).map((tType) => {
              const active = type === tType;
              let activeBg = colors.primary;
              if (active) {
                if (tType === 'income') activeBg = colors.income;
                if (tType === 'expense') activeBg = colors.expense;
                if (tType === 'transfer') activeBg = colors.transfer;
              }

              return (
                <TouchableOpacity
                  key={tType}
                  onPress={() => setType(tType)}
                  style={[
                    styles.segmentButton,
                    active && { backgroundColor: activeBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                      active && { fontWeight: fontWeight.bold },
                    ]}
                  >
                    {t(`transactions.${tType}`).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title input */}
          <Input
            label={t('transactions.title')}
            placeholder="e.g. Starbucks, Salary, Rent"
            value={title}
            onChangeText={setTitle}
            style={{ textAlign: textAlignment }}
          />

          {/* Transfers: From / To Account Selection */}
          {type === 'transfer' && (
            <Card style={[styles.cardSection, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.transfer')}</Text>
              <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                <Input
                  label="From Account"
                  value={fromAccount}
                  onChangeText={setFromAccount}
                  containerStyle={{ flex: 1, marginRight: isRTL ? 0 : spacing.sm, marginLeft: isRTL ? spacing.sm : 0, marginBottom: 0 }}
                  style={{ textAlign: textAlignment }}
                />
                <View style={styles.transferIconWrapper}>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color={colors.textSecondary} />
                </View>
                <Input
                  label="To Account"
                  value={toAccount}
                  onChangeText={setToAccount}
                  containerStyle={{ flex: 1, marginLeft: isRTL ? 0 : spacing.sm, marginRight: isRTL ? spacing.sm : 0, marginBottom: 0 }}
                  style={{ textAlign: textAlignment }}
                />
              </View>
            </Card>
          )}

          {/* Category Picker Grid */}
          <Card style={[styles.cardSection, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.selectCategory')}</Text>
            <View style={[styles.categoryGrid, { flexDirection: flexDirectionStyle }]}>
              {(() => {
                const displayedCategories = isExpanded ? categoryDetails : categoryDetails.slice(0, 7);
                const hasMore = categoryDetails.length > 7;

                return (
                  <>
                    {displayedCategories.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <TouchableOpacity
                          key={cat.key}
                          onPress={() => setCategory(cat.key)}
                          style={[
                            styles.categoryItem,
                            isSelected && {
                              backgroundColor: `${cat.color}15`,
                              borderColor: cat.color,
                              borderWidth: 1.5,
                            },
                          ]}
                        >
                          <View style={[styles.iconCircle, { backgroundColor: `${cat.color}15` }]}>
                            <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                          </View>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.categoryLabel,
                              { color: isSelected ? colors.text : colors.textSecondary },
                            ]}
                          >
                            {tCategory(cat.key)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {!isExpanded && hasMore && (
                      <TouchableOpacity onPress={() => setIsExpanded(true)} style={[styles.categoryItem]}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.border}50` }]}>
                          <Ionicons name="chevron-down" size={22} color={colors.textSecondary} />
                        </View>
                        <Text numberOfLines={1} style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                          More
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(!hasMore || isExpanded) && (
                      <TouchableOpacity
                        onPress={() => setShowCustomCatModal(true)}
                        style={[styles.categoryItem]}
                      >
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.border}50` }]}>
                          <Ionicons name="add" size={22} color={colors.textSecondary} />
                        </View>
                        <Text numberOfLines={1} style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                          Custom
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isExpanded && (
                      <TouchableOpacity onPress={() => setIsExpanded(false)} style={[styles.categoryItem]}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.border}50` }]}>
                          <Ionicons name="chevron-up" size={22} color={colors.textSecondary} />
                        </View>
                        <Text numberOfLines={1} style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                          Less
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </View>
          </Card>

          {/* Date Picker Row */}
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateRow, { borderBottomColor: colors.border, flexDirection: flexDirectionStyle }]}
          >
            <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
              <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.text, marginLeft: isRTL ? 0 : spacing.md, marginRight: isRTL ? spacing.md : 0 }]}>
                {formatDate(date.toISOString(), 'medium')}
              </Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Split Expense Row (Expense Only) */}
          {type === 'expense' && (
            <Card style={[styles.cardSection, { borderColor: colors.border }]}>
              <View style={[styles.switchRow, { flexDirection: flexDirectionStyle }]}>
                <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                  <Ionicons name="people-outline" size={22} color={colors.textSecondary} />
                  <View style={{ marginLeft: isRTL ? 0 : spacing.md, marginRight: isRTL ? spacing.md : 0, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.switchTitle, { color: colors.text }]}>{t('transactions.expense')} Splits</Text>
                    <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                      Share payment with friends
                    </Text>
                  </View>
                </View>
                <Switch value={isSplit} onValueChange={setIsSplit} thumbColor={colors.primary} />
              </View>

              {isSplit && (
                <View style={styles.splitBox}>
                  <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                    <Input
                      placeholder="Name"
                      value={splitName}
                      onChangeText={setSplitName}
                      containerStyle={{ flex: 1.2, marginRight: isRTL ? 0 : spacing.xs, marginLeft: isRTL ? spacing.xs : 0, marginBottom: 0 }}
                      style={{ textAlign: textAlignment }}
                    />
                    <Input
                      placeholder="Amt"
                      keyboardType="numeric"
                      value={splitAmount}
                      onChangeText={setSplitAmount}
                      containerStyle={{ flex: 0.8, marginRight: isRTL ? 0 : spacing.xs, marginLeft: isRTL ? spacing.xs : 0, marginBottom: 0 }}
                      style={{ textAlign: textAlignment }}
                    />
                    <Button title="Add" onPress={handleAddSplit} variant="primary" size="sm" />
                  </View>

                  {splits.length > 0 && (
                    <View style={styles.splitList}>
                      {splits.map((s) => (
                        <View key={s.id} style={[styles.splitItemRow, { flexDirection: flexDirectionStyle }]}>
                          <Text style={[styles.splitMemberName, { color: colors.text }]}>{s.name}</Text>
                          <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                            <Text style={[styles.splitMemberAmt, { color: colors.expense, marginRight: isRTL ? 0 : spacing.sm, marginLeft: isRTL ? spacing.sm : 0 }]}>
                              {currencySymbol}{s.amount}
                            </Text>
                            <IconButton
                              icon="trash-outline"
                              size="sm"
                              color={colors.error}
                              onPress={() => handleRemoveSplit(s.id)}
                            />
                          </View>
                        </View>
                      ))}
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <View style={[styles.splitSummary, { flexDirection: flexDirectionStyle }]}>
                        <Text style={{ color: colors.textSecondary }}>Total Splits:</Text>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                          {currencySymbol}{splits.reduce((acc, curr) => acc + curr.amount, 0)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          )}

          {/* Recurring rule configuration */}
          <Card style={[styles.cardSection, { borderColor: colors.border }]}>
            <View style={[styles.switchRow, { flexDirection: flexDirectionStyle }]}>
              <View style={[styles.row, { flexDirection: flexDirectionStyle }]}>
                <Ionicons name="repeat-outline" size={22} color={colors.textSecondary} />
                <View style={{ marginLeft: isRTL ? 0 : spacing.md, marginRight: isRTL ? spacing.md : 0, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>{t('settings.displayTheme', 'Recurring')}</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                    Automate this record over time
                  </Text>
                </View>
              </View>
              <Switch value={isRecurring} onValueChange={setIsRecurring} thumbColor={colors.primary} />
            </View>

            {isRecurring && (
              <View style={styles.recurringBox}>
                <Text style={{ color: colors.textSecondary, marginBottom: spacing.xs, textAlign: textAlignment }}>Frequency</Text>
                <View style={[styles.recurringSegments, { flexDirection: flexDirectionStyle }]}>
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => {
                    const active = recurrenceRule.frequency === freq;
                    return (
                      <TouchableOpacity
                        key={freq}
                        onPress={() => setRecurrenceRule((prev) => ({ ...prev, frequency: freq }))}
                        style={[
                          styles.freqBtn,
                          { borderColor: colors.border },
                          active && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 10 }}>
                          {freq.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </Card>

          {/* Note Area */}
          <Input
            label={t('transactions.notes')}
            placeholder="Add specific notes about this ledger item..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            style={[styles.textArea, { textAlign: textAlignment }]}
          />

          {/* Receipt Uploader */}
          <Card style={[styles.cardSection, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.receipt')}</Text>
            <TouchableOpacity onPress={handlePickImage} style={[styles.uploadCard, { borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
              <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                {t('transactions.uploadReceipt')}
              </Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={[styles.attachmentsGrid, { flexDirection: flexDirectionStyle }]}>
                {attachments.map((uri, idx) => (
                  <View key={idx} style={[styles.attachmentThumb, { borderColor: colors.border }]}>
                    <Image source={{ uri }} style={styles.thumbImage} />
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(idx)}
                      style={[styles.removeThumbBtn, { backgroundColor: colors.error }]}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Save Button */}
          <Button
            title={transactionId ? t('common.save') : t('common.save')}
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginTop: spacing.md, marginBottom: spacing['2xl'] }}
          />
        </ScrollView>
      </KeyboardAvoidingWrapper>

      {/* Custom Category Modal */}
      <Modal
        visible={showCustomCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowCustomCatModal(false)} activeOpacity={1} />
          
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: spacing.md }]}>New Category</Text>
            
            <Input
              label="Category Name"
              placeholder="e.g. Sushi, Gym, Steam"
              value={customCatName}
              onChangeText={setCustomCatName}
            />

            <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md }}>Select Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
              {['star', 'cafe', 'car', 'cart', 'heart', 'airplane', 'musical-notes', 'game-controller', 'bag', 'book', 'pizza', 'ice-cream'].map(iconName => {
                const isSelected = customCatIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    onPress={() => setCustomCatIcon(iconName)}
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      justifyContent: 'center', alignItems: 'center',
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1, borderColor: isSelected ? colors.primary : colors.border
                    }}
                  >
                    <Ionicons name={iconName as any} size={20} color={isSelected ? '#FFF' : colors.text} />
                  </TouchableOpacity>
                )
              })}
            </View>

            <Button
              title="Save Category"
              onPress={handleAddCustomCategory}
              variant="primary"
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  amountCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  amountInput: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    minWidth: 100,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  segmentContainer: {
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardSection: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  transferIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 48,
    marginTop: 20, // aligns with inputs
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: fontSize.xs - 2,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  dateRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  row: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  switchRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  switchSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  splitBox: {
    marginTop: spacing.lg,
  },
  splitList: {
    marginTop: spacing.md,
  },
  splitItemRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  splitMemberName: {
    fontSize: fontSize.sm,
  },
  splitMemberAmt: {
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
  recurringBox: {
    marginTop: spacing.md,
  },
  recurringSegments: {
    gap: spacing.xs,
  },
  freqBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  attachmentsGrid: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attachmentThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
