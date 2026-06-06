import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { RootStackScreenProps } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { parseUPIQRCode } from '../services/upi-parser';
import { UPIPaymentData } from '@/types/transaction';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';
import { Button, LoadingSpinner } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export function ScannerScreen({ navigation }: RootStackScreenProps<'Scanner'>) {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<UPIPaymentData | null>(null);
  const [qrDataToGenerate, setQrDataToGenerate] = useState<string | null>(null);

  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (qrDataToGenerate && pendingPaymentData && qrRef.current && isGenerating) {
      generateAndNavigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrDataToGenerate, pendingPaymentData, isGenerating]);

  const generateAndNavigate = async () => {
    if (!qrRef.current || !pendingPaymentData) return;

    try {
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');

          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const fileName = `qr_${Date.now()}.png`;
          const fileUri = FileSystem.cacheDirectory + fileName;

          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          navigation.replace('Payment', {
            upiId: pendingPaymentData.upiId,
            payeeName: pendingPaymentData.payeeName,
            amount: pendingPaymentData.amount?.toString() || '',
            transactionNote: pendingPaymentData.transactionNote || '',
            originalQRData: pendingPaymentData.originalQRData || '',
            isMerchant: pendingPaymentData.isMerchant ? 'true' : 'false',
            merchantCategory: pendingPaymentData.merchantParams?.mc || '',
            organizationId: pendingPaymentData.merchantParams?.orgid || '',
            qrImageUri: fileUri,
            generatedQR: 'true',
            amountLocked: 'true',
          });
        } catch {
          Alert.alert(t('common.error'), 'Failed to generate QR image. Please try again.');
          resetState();
        }
      });
    } catch {
      Alert.alert(t('common.error'), 'Failed to generate QR image. Please try again.');
      resetState();
    }
  };

  const resetState = () => {
    setScanned(false);
    setIsGenerating(false);
    setPendingPaymentData(null);
    setQrDataToGenerate(null);
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned || isGenerating) return;

    setScanned(true);
    const qrData = result.data;
    const paymentData = parseUPIQRCode(qrData);

    if (paymentData) {
      // Check if original QR has amount
      const hasAmountInOriginal = paymentData.amount !== undefined && paymentData.amount > 0;

      if (hasAmountInOriginal) {
        // Amount is in original QR - generate QR with original data (amount locked)
        setPendingPaymentData(paymentData);
        const originalUrl = paymentData.originalQRData || qrData;
        setQrDataToGenerate(originalUrl);
        setIsGenerating(true);
      } else {
        navigation.replace('Payment', {
          upiId: paymentData.upiId,
          payeeName: paymentData.payeeName,
          amount: '',
          transactionNote: paymentData.transactionNote || '',
          originalQRData: paymentData.originalQRData || qrData,
          isMerchant: paymentData.isMerchant ? 'true' : 'false',
          merchantCategory: paymentData.merchantParams?.mc || '',
          organizationId: paymentData.merchantParams?.orgid || '',
          qrImageUri: '',
          generatedQR: 'false',
          amountLocked: 'false',
        });
      }
    } else {
      Alert.alert(
        t('common.error', 'Invalid QR Code'),
        t('upi.invalidQR'),
        [
          { text: t('common.confirm', 'Try Again'), onPress: resetState },
          { text: t('common.back'), onPress: () => navigation.goBack(), style: 'cancel' },
        ]
      );
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner message={t('common.loading')} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.title, { color: colors.text }]}>{t('upi.cameraPermission')}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('upi.requestPermission')}
        </Text>
        <Button title={t('upi.grantButton', 'Grant Permission')} onPress={requestPermission} style={{ marginBottom: spacing.md }} />
        <Button title={t('common.back')} variant="outline" onPress={handleClose} />
      </View>
    );
  }

  // Hidden QR generator
  const hiddenQRGenerator = qrDataToGenerate && isGenerating ? (
    <View style={styles.hiddenQR}>
      <QRCode
        value={qrDataToGenerate}
        size={300}
        backgroundColor="white"
        color="black"
        getRef={(ref: any) => (qrRef.current = ref)}
      />
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        active={isFocused && !isGenerating}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {hiddenQRGenerator}

      <View style={styles.overlay}>
        <View style={styles.overlaySection}>
          <TouchableOpacity style={[styles.closeButton, { left: isRTL ? undefined : 20, right: isRTL ? 20 : undefined }]} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.overlaySection} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.overlaySection} />
        </View>

        <View style={styles.overlaySection}>
          <Text style={styles.instructionText}>{t('upi.scannerInstructions')}</Text>
        </View>
      </View>

      {isGenerating && (
        <View style={styles.generatingOverlay}>
          <LoadingSpinner message={t('upi.preparingPayment', 'Preparing payment...')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  overlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleSection: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  scanArea: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#14B8A6',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing.xl,
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
});
