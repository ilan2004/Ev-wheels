import {
  Geist,
  Geist_Mono,
  Instrument_Sans,
  Inter,
  Mulish,
  Noto_Sans_Mono
} from 'next/font/google';

import { cn } from '@/lib/utils';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  preload: false,
  display: 'swap'
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
  preload: false,
  display: 'swap'
});

const fontInstrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument'
});

const fontNotoMono = Noto_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-noto-mono'
});

const fontMullish = Mulish({
  subsets: ['latin'],
  variable: '--font-mullish'
});

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable
);
