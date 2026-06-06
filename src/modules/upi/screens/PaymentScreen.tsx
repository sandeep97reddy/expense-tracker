import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  Animated,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { ScreenWrapper, KeyboardAvoidingWrapper } from '@/components/layouts';
import { Button, Input, Card, LoadingSpinner } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransactionStore } from '@/modules/transactions/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { getCategoriesByType } from '@/modules/transactions/utils/categories';
import { useCategoryStore } from '@/modules/transactions/store/useCategoryStore';
import { openUPIPayment } from '../services/upi-launcher';
import { modifyUPIUrl, buildUPIUrl } from '../constants/upi-config';
import { notificationService } from '@/services/notifications/notificationService';
import type { RootStackParamList } from '@/navigation/types';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

// ─── Snackbar auto-dismiss duration ─────────────────────────────────────────
const SNACKBAR_DURATION = 6000; // 6 seconds

export function PaymentScreen() {
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<PaymentRouteProp>();
  const params = route.params;

  const { addTransaction, deleteTransaction } = useTransactionStore();

  const isMerchant = params.isMerchant === 'true';
  const isGeneratedQR = params.generatedQR === 'true';
  const amountLocked = params.amountLocked === 'true';

  const [amount, setAmount] = useState(params.amount || '');
  const [category, setCategory] = useState<string>('food');
  const [reason, setReason] = useState(params.transactionNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrDataToGenerate, setQrDataToGenerate] = useState<string | null>(null);
  
  // ─── Modal state ──────────────────────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // ─── Custom Category State ────────────────────────────────────────────────
  const addCustomCategory = useCategoryStore((state) => state.addCustomCategory);
  const [showCustomCatModal, setShowCustomCatModal] = useState(false);
  const [customCatName, setCustomCatName] = useState('');
  const [customCatIcon, setCustomCatIcon] = useState('star'); // default Ionicons icon
  const [isExpanded, setIsExpanded] = useState(false);

  // ─── Undo / snackbar state ────────────────────────────────────────────────
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const [awaitingReturn, setAwaitingReturn] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const snackbarOpacity = useRef(new Animated.Value(0)).current;
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const qrRef = useRef<any>(null);

  const qrImageUri = params.qrImageUri || '';
  const hasQrImage = !!qrImageUri;

  const canPay = params.upiId && amount && parseFloat(amount) > 0 && category;

  const expenseCategories = getCategoriesByType('expense');

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

  // ─── Snackbar helpers ─────────────────────────────────────────────────────
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    Animated.spring(snackbarOpacity, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after SNACKBAR_DURATION
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    snackbarTimer.current = setTimeout(() => {
      dismissSnackbar(true);
    }, SNACKBAR_DURATION);
  }, [snackbarOpacity]);

  const dismissSnackbar = useCallback((shouldNavigateBack = true) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    Animated.timing(snackbarOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSnackbarVisible(false);
      if (shouldNavigateBack) {
        navigation.goBack();
      }
    });
  }, [snackbarOpacity, navigation]);

  const handleUndo = useCallback(() => {
    if (pendingTransactionId) {
      deleteTransaction(pendingTransactionId);
      setPendingTransactionId(null);
    }
    // Stay on screen — don't navigate back. User can re-attempt or close manually.
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    Animated.timing(snackbarOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSnackbarVisible(false);
    });
  }, [pendingTransactionId, deleteTransaction, snackbarOpacity]);

  const handleAddCustomCategory = () => {
    if (!customCatName.trim()) return;
    addCustomCategory({
      label: customCatName.trim(),
      icon: customCatIcon,
      color: colors.primary,
      type: 'expense',
    });
    setShowCustomCatModal(false);
    setCustomCatName('');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    };
  }, []);

  // ─── AppState listener: detect return from UPI app ────────────────────────
  useEffect(() => {
    if (!awaitingReturn) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && awaitingReturn) {
        setAwaitingReturn(false);
        handleReturnFromUPIApp();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingReturn, pendingTransactionId]);

  /**
   * Called when user returns from UPI app.
   * Fires a local notification AND shows an in-app snackbar with Undo.
   */
  const handleReturnFromUPIApp = useCallback(() => {
    const amountNum = parseFloat(amount);

    // Fire OS-level local notification
    notificationService.scheduleUPIPaymentNotification(
      amountNum,
      params.payeeName,
      pendingTransactionId || '',
    ).catch((err: any) => console.warn('Notification failed:', err));

    // Show in-app snackbar (NOT a blocking Alert)
    showSnackbar(`₹${amountNum.toLocaleString('en-IN')} paid to ${params.payeeName}`);
  }, [amount, pendingTransactionId, params.payeeName, showSnackbar]);

  // ─── Build the UPI deep-link URL ──────────────────────────────────────────
  /**
   * KEY FIX for payment rejections:
   * - Merchant QR codes contain a digital signature (sign=...).
   *   Re-encoding or modifying the URL invalidates that signature,
   *   causing UPI apps to reject the payment.
   * - For merchant QRs with a locked amount: use originalQRData VERBATIM.
   * - For P2P or amount-unlocked: modifyUPIUrl is safe.
   */
  const buildCurrentUPIUrl = useCallback((): string => {
    const amountNum = parseFloat(amount);
    const originalUrl = params.originalQRData || '';

    // Merchant with locked amount → use the original URL exactly as scanned
    if (isMerchant && amountLocked && originalUrl) {
      return originalUrl;
    }

    // Has original QR data (P2P, or merchant without amount) → modify carefully
    if (originalUrl) {
      return modifyUPIUrl(originalUrl, amountNum, reason.trim() || undefined);
    }

    // No original data (manual entry) → build from scratch
    return buildUPIUrl({
      upiId: params.upiId,
      payeeName: params.payeeName,
      amount: amountNum,
      transactionNote: reason.trim() || undefined,
    });
  }, [amount, reason, params.originalQRData, params.upiId, params.payeeName, isMerchant, amountLocked]);

  // ─── After confirmation: save transaction → open OS UPI chooser directly ──
  const proceedToPayment = useCallback(async () => {
    const amountNum = parseFloat(amount);

    // Save transaction and capture the ID for undo
    const txId = addTransaction({
      amount: amountNum,
      type: 'expense',
      category: category as any,
      title: isMerchant ? params.payeeName : `UPI to ${params.payeeName}`,
      note: reason.trim() || undefined,
      date: new Date().toISOString(),
      upiId: params.upiId,
      payeeName: params.payeeName,
      transactionType: isMerchant ? 'merchant' : 'p2p',
      merchantCategory: params.merchantCategory || undefined,
      organizationId: params.organizationId || undefined,
    });

    setPendingTransactionId(txId);

    // Build the UPI deep link
    const upiUrl = buildCurrentUPIUrl();

    // Open the OS-native UPI app chooser directly (no custom picker)
    const success = await openUPIPayment(upiUrl);

    if (!success) {
      // No UPI app found — revert the transaction
      deleteTransaction(txId);
      setPendingTransactionId(null);
      Alert.alert(
        'No UPI App Found',
        'Please install a UPI payment app (Google Pay, PhonePe, Paytm, etc.) to make payments.',
      );
    } else {
      // App opened — listen for return
      setAwaitingReturn(true);
    }

    setIsLoading(false);
    setIsGeneratingQR(false);
  }, [
    amount, category, reason, isMerchant,
    params.payeeName, params.upiId, params.merchantCategory, params.organizationId,
    addTransaction, deleteTransaction, buildCurrentUPIUrl,
  ]);

  // ─── QR generation flow (still needed for unlocked-amount scanner path) ───
  const handleQRGenerated = async () => {
    if (!qrRef.current) return;

    qrRef.current.toDataURL(async (dataURL: string) => {
      try {
        const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
        const fileName = `qr_pay_${Date.now()}.png`;
        const fileUri = FileSystem.cacheDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // QR generated — now proceed to payment
        await proceedToPayment();
      } catch (error) {
        console.error('QR generation error:', error);
        Alert.alert(t('common.error'), 'Failed to generate QR image. Please try again.');
        setIsLoading(false);
        setIsGeneratingQR(false);
      }
    });
  };

  const handlePay = async () => {
    if (!canPay) {
      Alert.alert(t('upi.parameterError'), t('upi.parameterError'));
      return;
    }
    
    // Show modern confirmation modal
    setShowConfirmModal(true);
  };

  const confirmPayment = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);

    if (hasQrImage && amountLocked) {
      // Amount locked in QR → proceed directly
      await proceedToPayment();
    } else {
      // Need to generate QR with user's amount
      const amountNum = parseFloat(amount);
      const originalUrl = params.originalQRData || '';
      const modifiedUrl = modifyUPIUrl(originalUrl, amountNum, reason.trim() || undefined);

      setQrDataToGenerate(modifiedUrl);
      setIsGeneratingQR(true);

      setTimeout(() => {
        if (qrRef.current) {
          handleQRGenerated();
        }
      }, 300);
    }
  };

  const handleClose = () => {
    Alert.alert('Discard Payment?', 'Are you sure you want to cancel this payment?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => navigation.goBack(), style: 'destructive' },
    ]);
  };

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingWrapper>
        <View style={[styles.header, { flexDirection: flexDirectionStyle }]}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('upi.payTitle')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Waiting for payment banner */}
        {awaitingReturn && (
          <View style={[styles.waitingBanner, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
              Waiting for payment completion...
            </Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Modern Payment Confirmation Card */}
          <View style={[
            styles.paymentCard, 
            { 
              backgroundColor: colors.surfaceElevated,
            }
          ]}>
            {/* Payee Profile */}
            <View style={styles.payeeProfile}>
              <View style={[styles.avatarContainer, { backgroundColor: `${colors.primary}15` }]}>
                {isMerchant ? (
                  <Ionicons name="storefront" size={28} color={colors.primary} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {params.payeeName ? params.payeeName.charAt(0).toUpperCase() : '?'}
                  </Text>
                )}
              </View>
              <Text style={[styles.payeeNameText, { color: colors.text }]} numberOfLines={1}>
                {params.payeeName}
              </Text>
              <Text style={[styles.upiIdText, { color: colors.textSecondary }]} numberOfLines={1}>
                {params.upiId}
              </Text>
              {isMerchant && (
                <View style={[styles.merchantBadge, { backgroundColor: `${colors.primary}15`, flexDirection: flexDirectionStyle }]}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.merchantBadgeText, { color: colors.primary }]}>
                    Verified Merchant
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

            {/* Amount Section */}
            <View style={styles.amountContainer}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                {t('transactions.enterAmount').toUpperCase()}
              </Text>
              <View style={[styles.amountInputRow, { flexDirection: flexDirectionStyle }]}>
                <Text style={[styles.currencySymbol, { color: colors.text, marginRight: isRTL ? 0 : spacing.xs, marginLeft: isRTL ? spacing.xs : 0 }]}>
                  {currencySymbol}
                </Text>
                <Input
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!amountLocked}
                  style={[
                    styles.amountInput,
                    { color: amountLocked ? colors.primary : colors.text, textAlign: 'center' },
                  ]}
                  containerStyle={{ marginBottom: 0, flex: 1, borderWidth: 0, backgroundColor: 'transparent' }}
                  maxLength={9}
                />
                {amountLocked && (
                  <View style={[styles.lockBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="lock-closed" size={16} color={colors.primary} />
                  </View>
                )}
              </View>
            </View>

            {/* Note Section */}
            {(amountLocked && params.transactionNote) ? (
              <View style={styles.noteDisplay}>
                 <Text style={[styles.noteDisplayText, { color: colors.textSecondary }]} numberOfLines={2}>
                   Note: {params.transactionNote}
                 </Text>
              </View>
            ) : (
              <View style={[styles.noteInputWrapper, { backgroundColor: colors.surface }]}>
                <Input
                  placeholder="Add a note (optional)"
                  value={reason}
                  onChangeText={setReason}
                  maxLength={50}
                  style={{ textAlign: 'center', fontSize: fontSize.sm }}
                  containerStyle={{ marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent' }}
                />
              </View>
            )}

            <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

            {/* Branding / Secure Note */}
            <View style={[styles.brandingFooter, { flexDirection: flexDirectionStyle }]}>
               <Ionicons name="shield-checkmark" size={16} color={colors.success} />
               <Text style={[styles.brandingText, { color: colors.textSecondary }]}>
                 Secure UPI Payment
               </Text>
            </View>
          </View>

          {/* Category Picker Grid */}
          <View style={styles.categorySection}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.selectCategory')}</Text>
            <View style={[styles.categoryGrid, { flexDirection: flexDirectionStyle }]}>
              {(() => {
                const displayedCategories = isExpanded ? expenseCategories : expenseCategories.slice(0, 7);
                const hasMore = expenseCategories.length > 7;

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
          </View>

          <Button
            title={t('upi.payButton')}
            onPress={handlePay}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading || isGeneratingQR}
            disabled={!canPay || isLoading || isGeneratingQR}
            leftIcon={!isLoading && !isGeneratingQR ? <Ionicons name="wallet-outline" size={20} color="#fff" /> : undefined}
            style={{ marginTop: spacing.md, marginBottom: spacing['2xl'] }}
          />
        </ScrollView>
      </KeyboardAvoidingWrapper>

      {/* Hidden QR Generator for user custom amounts */}
      {isGeneratingQR && qrDataToGenerate && (
        <View style={styles.hiddenQR}>
          <QRCode
            value={qrDataToGenerate}
            size={300}
            backgroundColor="white"
            color="black"
            getRef={(ref: any) => (qrRef.current = ref)}
          />
        </View>
      )}

      {isGeneratingQR && (
        <View style={styles.generatingOverlay}>
          <LoadingSpinner message={t('upi.preparingPayment', 'Preparing payment...')} />
        </View>
      )}

      {/* ─── In-app Snackbar with Undo ─────────────────────────────────────── */}
      {snackbarVisible && (
        <Animated.View
          style={[
            styles.snackbar,
            {
              backgroundColor: colors.text,
              opacity: snackbarOpacity,
              transform: [{
                translateY: snackbarOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.snackbarContent}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.snackbarText, { color: colors.background }]} numberOfLines={2}>
              {snackbarMessage}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleUndo}
            style={[styles.undoButton, { backgroundColor: `${colors.warning}25` }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.undoText, { color: colors.warning }]}>UNDO</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ─── Modern Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowConfirmModal(false)} activeOpacity={1} />
          
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}>
            <View style={[styles.modalDragIndicator, { backgroundColor: colors.border }]} />
            
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('upi.confirmingDetails')}</Text>
            </View>

            <View style={[styles.modalWarningBox, { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}50` }]}>
              <Ionicons name="warning" size={20} color={colors.warning} style={{ marginTop: 2 }} />
              <Text style={[styles.modalWarningText, { color: colors.textSecondary }]}>
                {t('upi.antiQuishingWarning')}
              </Text>
            </View>

            <View style={[styles.modalDetailsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalDetailRow}>
                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>{t('upi.payeeName')}</Text>
                <Text style={[styles.modalDetailValue, { color: colors.text }]} numberOfLines={1}>{params.payeeName}</Text>
              </View>
              <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
              <View style={styles.modalDetailRow}>
                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>{t('upi.upiId')}</Text>
                <Text style={[styles.modalDetailValue, { color: colors.text }]} numberOfLines={1}>{params.upiId}</Text>
              </View>
              <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
              <View style={styles.modalDetailRow}>
                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>{t('transactions.amount')}</Text>
                <Text style={[styles.modalDetailValueAmount, { color: colors.primary }]} numberOfLines={1}>
                  {currencySymbol}{amount}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => setShowConfirmModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <View style={{ width: spacing.md }} />
              <Button
                title={t('common.confirm')}
                onPress={confirmPayment}
                variant="primary"
                style={{ flex: 1 }}
                leftIcon={<Ionicons name="lock-closed" size={16} color="#fff" />}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Custom Category Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showCustomCatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomCatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowCustomCatModal(false)} activeOpacity={1} />
          
          <View style={[styles.modalContent, { backgroundColor: colors.background, paddingBottom: Platform.OS === 'ios' ? 40 : 24 }]}>
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
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  paymentCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  payeeProfile: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  payeeNameText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  upiIdText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  merchantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  merchantBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: -spacing.lg,
    opacity: 0.3,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  amountLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  amountInput: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    minWidth: 120,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  noteDisplay: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noteDisplayText: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noteInputWrapper: {
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  brandingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  brandingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
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
  hiddenQR: {
    position: 'absolute',
    top: -1000,
    left: -1000,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // ─── Snackbar styles ──────────────────────────────────────────────────────
  snackbar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  snackbarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  snackbarText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  undoButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  undoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  
  // ─── Modal Styles ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalWarningBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  modalWarningText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  modalDetailsBox: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalDetailLabel: {
    fontSize: fontSize.sm,
  },
  modalDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.lg,
  },
  modalDetailValueAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalDivider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
});

