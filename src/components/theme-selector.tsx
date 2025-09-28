'use client';

import { useThemeConfig } from '@/components/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const DEFAULT_THEMES = [
  {
    name: 'Default',
    value: 'default',
    color: '⚫'
  },
  {
    name: 'Blue',
    value: 'blue',
    color: '🔵'
  },
  {
    name: 'Green',
    value: 'green', 
    color: '🟢'
  },
  {
    name: 'Amber',
    value: 'amber',
    color: '🟡'
  }
];

const SCALED_THEMES = [
  {
    name: 'Default',
    value: 'default-scaled',
    color: '⚫'
  },
  {
    name: 'Blue',
    value: 'blue-scaled',
    color: '🔵'
  }
];

const MONO_THEMES = [
  {
    name: 'Mono Neutral',
    value: 'mono-scaled',
    color: '🔘'
  },
  {
    name: 'Mono Blue',
    value: 'mono-blue-scaled',
    color: '🔵'
  },
  {
    name: 'Mono Green', 
    value: 'mono-green-scaled',
    color: '🟢'
  },
  {
    name: 'Mono Red',
    value: 'mono-red-scaled', 
    color: '🔴'
  },
  {
    name: 'Mono Purple',
    value: 'mono-purple-scaled',
    color: '🟣'
  },
  {
    name: 'Mono Orange',
    value: 'mono-orange-scaled',
    color: '🟠'
  },
  {
    name: 'Mono Pink',
    value: 'mono-pink-scaled',
    color: '🩷'
  },
  {
    name: 'Mono Cyan',
    value: 'mono-cyan-scaled',
    color: '🩵'
  },
  {
    name: 'Mono Lime',
    value: 'mono-lime-scaled',
    color: '🟢'
  },
  {
    name: 'Mono Amber',
    value: 'mono-amber-scaled',
    color: '🟡'
  }
];

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id='theme-selector'
          className='justify-start *:data-[slot=select-value]:w-12'
        >
          <span className='text-muted-foreground hidden sm:block'>
            Select a theme:
          </span>
          <span className='text-muted-foreground block sm:hidden'>Theme</span>
          <SelectValue placeholder='Select a theme' />
        </SelectTrigger>
        <SelectContent align='end'>
          <SelectGroup>
            <SelectLabel>Default</SelectLabel>
            {DEFAULT_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{theme.color}</span>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Scaled</SelectLabel>
            {SCALED_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{theme.color}</span>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Monospaced</SelectLabel>
            {MONO_THEMES.map((theme) => (
              <SelectItem key={theme.name} value={theme.value}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{theme.color}</span>
                  <span>{theme.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
