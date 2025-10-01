'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCamera, IconUpload, IconX } from '@tabler/icons-react';

type Mode = 'vehicle' | 'battery';

type SlotKey = 'front' | 'back' | 'left' | 'right' | 'photo1' | 'photo2';

const VEHICLE_SLOTS: { key: SlotKey; label: string; hint: string }[] = [
  { key: 'front', label: 'Front', hint: 'Number plate visible if possible' },
  { key: 'back', label: 'Back', hint: 'Include boot/tail section' },
  { key: 'left', label: 'Left side', hint: 'Full side profile' },
  { key: 'right', label: 'Right side', hint: 'Full side profile' }
];

const BATTERY_SLOTS: { key: SlotKey; label: string; hint: string }[] = [
  { key: 'photo1', label: 'Photo 1', hint: 'Top or overall view' },
  { key: 'photo2', label: 'Photo 2', hint: 'Label / Serial if available' }
];

export interface GuidedIntakePhotosProps {
  mode: Mode;
  onFilesChange: (files: File[]) => void;
  className?: string;
}

export function GuidedIntakePhotos({
  mode,
  onFilesChange,
  className = ''
}: GuidedIntakePhotosProps) {
  const [slots, setSlots] = useState<Record<SlotKey, File | undefined>>({
    front: undefined,
    back: undefined,
    left: undefined,
    right: undefined,
    photo1: undefined,
    photo2: undefined
  });

  const inputRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
    photo1: null,
    photo2: null
  });

  const activeSlots = mode === 'vehicle' ? VEHICLE_SLOTS : BATTERY_SLOTS;
  const requiredCount = activeSlots.length;

  const files = useMemo(
    () => activeSlots.map((s) => slots[s.key]).filter(Boolean) as File[],
    [activeSlots, slots]
  );
  const requiredMet = files.length >= requiredCount;

  const triggerPick = useCallback((key: SlotKey) => {
    inputRefs.current[key]?.click();
  }, []);

  const onChangeSlot = useCallback(
    (key: SlotKey, file: File | null) => {
      setSlots((prev) => {
        const next = { ...prev, [key]: file ?? undefined };
        const picked = activeSlots
          .map((s) => next[s.key])
          .filter(Boolean) as File[];
        onFilesChange(picked);
        return next;
      });
    },
    [activeSlots, onFilesChange]
  );

  return (
    <div className={className}>
      <div className='mb-2 text-sm'>
        <span className={requiredMet ? 'text-green-600' : 'text-amber-600'}>
          {requiredMet
            ? 'Minimum photos captured'
            : `Add ${requiredCount} required photos`}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {activeSlots.map((slot) => {
          const file = slots[slot.key];
          const preview = file ? URL.createObjectURL(file) : null;
          return (
            <Card
              key={slot.key}
              className={`overflow-hidden border-dashed ${file ? 'border-solid' : ''}`}
            >
              <CardContent className='flex h-40 flex-col items-center justify-center gap-2 p-3 text-center'>
                {file ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview as string}
                      alt={slot.label}
                      className='h-24 w-full rounded object-cover'
                    />
                    <div className='flex items-center gap-2'>
                      <Badge variant='secondary'>{slot.label}</Badge>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => onChangeSlot(slot.key, null)}
                      >
                        <IconX className='h-4 w-4' />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='text-muted-foreground text-xs'>
                      {slot.hint}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => triggerPick(slot.key)}
                    >
                      <IconUpload className='mr-2 h-4 w-4' /> {slot.label}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => triggerPick(slot.key)}
                    >
                      <IconCamera className='mr-2 h-4 w-4' /> Camera
                    </Button>
                  </>
                )}
                <input
                  ref={(el) => {
                    inputRefs.current[slot.key] = el;
                  }}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) =>
                    onChangeSlot(slot.key, e.target.files?.[0] || null)
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
