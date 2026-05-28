/**
 * UPI App Definitions
 * Static list of supported UPI payment apps with their Android package names
 * and bundled icon assets. Used by UPIAppPicker and the deep-link launcher.
 */

export interface UPIApp {
  /** Android package name — used to build intent:// deep link */
  packageName: string;
  /** Display name shown in the picker */
  name: string;
  /** Bundled local icon (require'd PNG) */
  icon: any;
  /** UPI scheme used by this app (default: 'upi') */
  scheme?: string;
}

/**
 * Preferred apps are listed first (GPay, PhonePe, Paytm, BHIM, Amazon Pay).
 * Icons are loaded from the local assets/upi/ directory.
 */
export const UPI_APPS: UPIApp[] = [
  {
    packageName: 'com.google.android.apps.nbu.paisa.user',
    name: 'Google Pay',
    icon: require('../../../../assets/upi/google-pay.png'),
  },
  {
    packageName: 'com.phonepe.app',
    name: 'PhonePe',
    icon: require('../../../../assets/upi/phone-pe.png'),
  },
  {
    packageName: 'net.one97.paytm',
    name: 'Paytm',
    icon: require('../../../../assets/upi/paytm.png'),
  },
  {
    packageName: 'in.org.npci.upiapp',
    name: 'BHIM',
    icon: require('../../../../assets/upi/bhim.png'),
  },
  {
    packageName: 'in.amazon.mShop.android.shopping',
    name: 'Amazon Pay',
    icon: require('../../../../assets/upi/amazonpay.png'),
  },
];
