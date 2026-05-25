import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { ScreenWrapper, KeyboardAvoidingWrapper } from '@/components/layouts';
import { Button, Input, Card } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useTransactionStore } from '@/modules/transactions/store/useTransactionStore';
import { useAppStore } from '@/store/useAppStore';
import { getCategoriesByType } from '@/modules/transactions/utils/categories';
import { shareQRImage } from '../services/upi-launcher';
import { modifyUPIUrl } from '../constants/upi-config';
import type { RootStackParamList } from '@/navigation/types';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;

export function PaymentScreen() {
  const { colors } = useTheme();
  const { t, tCategory, isRTL } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<PaymentRouteProp>();
  const params = route.params;

  const { addTransaction } = useTransactionStore();

  const isMerchant = params.isMerchant === 'true';
  const isGeneratedQR = params.generatedQR === 'true';
  const amountLocked = params.amountLocked === 'true';

  const [amount, setAmount] = useState(params.amount || '');
  const [category, setCategory] = useState<string>('food'); // default expense category
  const [reason, setReason] = useState(params.transactionNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrDataToGenerate, setQrDataToGenerate] = useState<string | null>(null);

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

  const generateAndShare = async (qrUri: string) => {
    try {
      const amountNum = parseFloat(amount);

      // Save transaction
      addTransaction({
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

      // Share QR
      const success = await shareQRImage({ qrImageUri: qrUri });
      if (!success) {
        Alert.alert(t('common.error'), 'Failed to open UPI apps. Make sure you have a UPI app installed.');
      } else {
        // give it a moment before closing to not interrupt the share sheet pop up
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(t('common.error'), 'Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
      setIsGeneratingQR(false);
    }
  };

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

        await generateAndShare(fileUri);
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

    // INTERMEDIARY CONFIRMATION VIEW alert check (Security Pillar 4)
    Alert.alert(
      t('upi.confirmingDetails'),
      `${t('upi.antiQuishingWarning')}\n\n${t('upi.payeeName')}: ${params.payeeName}\n${t('upi.upiId')}: ${params.upiId}`,
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => setIsLoading(false) },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setIsLoading(true);

            if (hasQrImage && amountLocked) {
              await generateAndShare(qrImageUri);
            } else {
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
          }
        }
      ]
    );
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Payee Info Card */}
          <Card style={[styles.payeeCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: flexDirectionStyle }]}>
            <View style={[styles.payeeIconContainer, { marginRight: isRTL ? 0 : spacing.md, marginLeft: isRTL ? spacing.md : 0 }]}>
              <Ionicons
                name={isMerchant ? 'storefront' : 'person-circle'}
                size={48}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.payeeNameText, { color: colors.text }]} numberOfLines={1}>
                {params.payeeName}
              </Text>
              <Text style={[styles.upiIdText, { color: colors.textSecondary }]} numberOfLines={1}>
                {params.upiId}
              </Text>
              {isMerchant && (
                <View style={[styles.merchantBadge, { backgroundColor: `${colors.primary}20`, flexDirection: flexDirectionStyle }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={[styles.merchantBadgeText, { color: colors.primary }]}>
                    Verified Merchant
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {amountLocked && (
            <View style={[styles.infoCard, { backgroundColor: `${colors.primary}15`, flexDirection: flexDirectionStyle }]}>
              <Ionicons name="lock-closed" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary, textAlign: textAlignment }]}>
                {t('upi.currencyLocked')}
              </Text>
            </View>
          )}

          {/* Amount Display Card */}
          <Card style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: amountLocked ? colors.primary : colors.border }]}>
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
                editable={!amountLocked}
                style={[
                  styles.amountInput,
                  { color: amountLocked ? colors.textSecondary : colors.text, textAlign: textAlignment },
                ]}
                containerStyle={{ marginBottom: 0, flex: 1 }}
                maxLength={9}
              />
              {amountLocked && (
                <Ionicons name="lock-closed" size={24} color={colors.primary} style={{ marginLeft: spacing.sm }} />
              )}
            </View>
          </Card>

          {/* Category Picker Grid */}
          <Card style={[styles.cardSection, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: textAlignment }]}>{t('transactions.selectCategory')}</Text>
            <View style={[styles.categoryGrid, { flexDirection: flexDirectionStyle }]}>
              {expenseCategories.map((cat) => {
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
            </View>
          </Card>

          <Input
            label={t('transactions.notes')}
            placeholder="e.g., Groceries, Lunch, etc."
            value={reason}
            onChangeText={setReason}
            maxLength={50}
            style={{ textAlign: textAlignment }}
          />

          <Button
            title={isGeneratingQR || isLoading ? t('common.loading') : t('upi.payButton')}
            onPress={handlePay}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canPay || isLoading || isGeneratingQR}
            leftIcon={!isLoading && !isGeneratingQR ? <Ionicons name="share-outline" size={20} color="#fff" /> : undefined}
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
  payeeCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  payeeIconContainer: {},
  payeeInfo: {},
  payeeNameText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  upiIdText: {
    fontSize: fontSize.sm,
  },
  merchantBadge: {
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  merchantBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  infoCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: spacing.md,
    fontWeight: fontWeight.medium,
  },
  amountCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
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
  categoryGrid: {
    gap: spacing.md,
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
});
