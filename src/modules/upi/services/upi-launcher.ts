/**
 * UPI App Launcher
 * Opens the OS-native UPI app chooser with a plain upi:// deep link.
 * The OS shows only installed UPI/banking apps — no custom picker needed.
 *
 * IMPORTANT: For merchant QR codes (with digital signature), the original
 * URL must be passed verbatim. Re-encoding or reconstructing the URL
 * invalidates the merchant's cryptographic signature, causing UPI apps
 * to reject the payment for security reasons.
 */

import { Linking } from 'react-native';

/**
 * Open the OS-native UPI app chooser with the given UPI URL.
 * Android will show an intent chooser with all installed UPI-capable apps.
 * iOS will open the default UPI handler.
 *
 * @param upiUrl - Full UPI URL exactly as scanned or constructed.
 *                 e.g. 'upi://pay?pa=merchant@upi&pn=Store&am=100&cu=INR&sign=...'
 * @returns true if at least one UPI app is available and the URL was opened
 */
export const openUPIPayment = async (upiUrl: string): Promise<boolean> => {
  try {
    // Check if any app can handle upi:// URLs
    const canOpen = await Linking.canOpenURL(upiUrl);
    if (!canOpen) {
      console.warn('[UPI] No UPI app found to handle:', upiUrl.substring(0, 60));
      return false;
    }

    // Open — OS shows the native app chooser (only installed UPI apps)
    await Linking.openURL(upiUrl);
    return true;
  } catch (error) {
    console.error('[UPI] Failed to open UPI payment URL:', error);
    return false;
  }
};
