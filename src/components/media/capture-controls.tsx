'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaptureControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  onPhotos?: (files: File[]) => void | Promise<void>;
  onAudio?: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
}

export default function CaptureControls({
  onPhotos,
  onAudio,
  disabled,
  className
}: CaptureControlsProps) {
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingElapsedSec, setRecordingElapsedSec] = React.useState(0);
  const recordingTimerRef = React.useRef<number | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const recordedChunksRef = React.useRef<BlobPart[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Pending preview states (photos)
  const [pendingPhotos, setPendingPhotos] = React.useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = React.useState<string[]>([]);
  const [replaceIndex, setReplaceIndex] = React.useState<number | null>(null);
  const [photoSubmitting, setPhotoSubmitting] = React.useState(false);

  // Pending preview states (audio)
  const [pendingAudio, setPendingAudio] = React.useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = React.useState<string | null>(
    null
  );
  const [audioDurationSec, setAudioDurationSec] = React.useState<number | null>(
    null
  );
  const [audioSubmitting, setAudioSubmitting] = React.useState(false);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      stopStream();
      if (recordingTimerRef.current)
        window.clearInterval(recordingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length) {
        const file = files[0];
        const url = URL.createObjectURL(file);
        setPendingPhotos((prev) => {
          const next = [...prev];
          if (
            replaceIndex != null &&
            replaceIndex >= 0 &&
            replaceIndex < next.length
          ) {
            next[replaceIndex] = file;
          } else {
            next.push(file);
          }
          return next;
        });
        setPhotoPreviewUrls((prev) => {
          const next = [...prev];
          if (
            replaceIndex != null &&
            replaceIndex >= 0 &&
            replaceIndex < next.length
          ) {
            URL.revokeObjectURL(next[replaceIndex]);
            next[replaceIndex] = url;
          } else {
            next.push(url);
          }
          return next;
        });
        setReplaceIndex(null);
      }
      if (photoInputRef.current) photoInputRef.current.value = ''; // reset picker
    },
    [replaceIndex]
  );

  const confirmPhotos = React.useCallback(async () => {
    if (!pendingPhotos.length) return;
    try {
      setPhotoSubmitting(true);
      await onPhotos?.(pendingPhotos);
      // cleanup
      photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
      setPendingPhotos([]);
      setPhotoPreviewUrls([]);
    } finally {
      setPhotoSubmitting(false);
    }
  }, [onPhotos, pendingPhotos, photoPreviewUrls]);

  const clearPhotos = React.useCallback(() => {
    photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPendingPhotos([]);
    setPhotoPreviewUrls([]);
    setReplaceIndex(null);
  }, [photoPreviewUrls]);

  const replaceLastPhoto = React.useCallback(() => {
    if (!pendingPhotos.length) return;
    setReplaceIndex(pendingPhotos.length - 1);
    photoInputRef.current?.click();
  }, [pendingPhotos.length]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0)
          recordedChunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mr.mimeType || 'audio/webm'
        });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: blob.type
        });
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setPendingAudio(file);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setAudioDurationSec(recordingElapsedSec);
        stopStream();
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingElapsedSec(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingElapsedSec(0);
      if (recordingTimerRef.current)
        window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingElapsedSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error(
        'Microphone capture failed, falling back to file picker.',
        err
      );
      audioInputRef.current?.click();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const handleAudioChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length) {
        const file = files[0];
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setPendingAudio(file);
        setAudioPreviewUrl(URL.createObjectURL(file));
        setAudioDurationSec(null);
      }
      if (audioInputRef.current) audioInputRef.current.value = '';
    },
    [audioPreviewUrl]
  );

  const confirmAudio = React.useCallback(async () => {
    if (!pendingAudio) return;
    try {
      setAudioSubmitting(true);
      await onAudio?.([pendingAudio]);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setPendingAudio(null);
      setAudioPreviewUrl(null);
      setAudioDurationSec(null);
    } finally {
      setAudioSubmitting(false);
    }
  }, [onAudio, pendingAudio, audioPreviewUrl]);

  const discardAudio = React.useCallback(() => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setPendingAudio(null);
    setAudioPreviewUrl(null);
    setAudioDurationSec(null);
  }, [audioPreviewUrl]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {onPhotos && (
        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap gap-2'>
            <input
              ref={photoInputRef}
              type='file'
              accept='image/*'
              capture='environment'
              className='hidden'
              onChange={handlePhotoChange}
            />
            <Button
              type='button'
              variant='outline'
              disabled={disabled}
              onClick={() => photoInputRef.current?.click()}
            >
              Take Photo
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={disabled || !pendingPhotos.length}
              onClick={replaceLastPhoto}
            >
              Replace Last
            </Button>
            <Button
              type='button'
              disabled={disabled || !pendingPhotos.length || photoSubmitting}
              onClick={confirmPhotos}
            >
              {photoSubmitting
                ? 'Uploading…'
                : `Use ${pendingPhotos.length} Photo${pendingPhotos.length > 1 ? 's' : ''}`}
            </Button>
            <Button
              type='button'
              variant='ghost'
              disabled={!pendingPhotos.length || photoSubmitting}
              onClick={clearPhotos}
            >
              Clear
            </Button>
          </div>

          {photoPreviewUrls.length > 0 && (
            <div className='flex items-center gap-2 overflow-x-auto py-1'>
              {photoPreviewUrls.map((u, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={u}
                  alt={`captured-${idx}`}
                  className='h-20 w-20 shrink-0 rounded border object-cover'
                />
              ))}
            </div>
          )}
        </div>
      )}

      {onAudio && (
        <div className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <input
              ref={audioInputRef}
              type='file'
              accept='audio/*'
              capture
              className='hidden'
              onChange={handleAudioChange}
            />
            {typeof window !== 'undefined' && 'MediaRecorder' in window ? (
              isRecording ? (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={stopRecording}
                >
                  Stop Recording{' '}
                  {recordingElapsedSec > 0 ? `(${recordingElapsedSec}s)` : ''}
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='outline'
                  disabled={disabled}
                  onClick={startRecording}
                >
                  Record Voice
                </Button>
              )
            ) : (
              <Button
                type='button'
                variant='outline'
                disabled={disabled}
                onClick={() => audioInputRef.current?.click()}
              >
                Record Voice
              </Button>
            )}
          </div>

          {pendingAudio && audioPreviewUrl && (
            <div className='flex items-center gap-3'>
              <audio
                src={audioPreviewUrl}
                controls
                className='w-full max-w-xs'
              />
              <div className='flex items-center gap-2'>
                {audioDurationSec != null && (
                  <span className='text-muted-foreground text-xs'>
                    {audioDurationSec}s
                  </span>
                )}
                <Button
                  type='button'
                  onClick={confirmAudio}
                  disabled={disabled || audioSubmitting}
                >
                  {audioSubmitting ? 'Uploading…' : 'Use Recording'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={discardAudio}
                  disabled={audioSubmitting}
                >
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
