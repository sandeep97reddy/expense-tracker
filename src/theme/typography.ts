/**
 * Typography scale — font sizes and weights
 */

export const fontSize = {
  /** 10px — tiny labels */
  '2xs': 10,
  /** 12px — captions */
  xs: 12,
  /** 14px — body small */
  sm: 14,
  /** 16px — body */
  base: 16,
  /** 18px — body large */
  lg: 18,
  /** 20px — subheading */
  xl: 20,
  /** 24px — heading */
  '2xl': 24,
  /** 30px — page title */
  '3xl': 30,
  /** 36px — hero */
  '4xl': 36,
  /** 48px — display */
  '5xl': 48,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
