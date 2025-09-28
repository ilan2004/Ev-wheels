'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IconCamera,
  IconMicrophone,
  IconUpload,
  IconX,
  IconCheck,
  IconLoader2,
  IconPhoto,
  IconPlayerPlay,
  IconPlayerStop,
  IconDownload
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface MediaFile {
  id: string;
  file: File;
  type: 'photo' | 'audio' | 'document';
  thumbnail?: string;
  compressed?: boolean;
  transcription?: string;
  uploadProgress?: number;
  uploaded?: boolean;
  error?: string;
}

export interface SmartMediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  enableVoiceToText?: boolean;
  enableAutoCompression?: boolean;
  acceptedTypes?: string[];
  className?: string;
}

export function SmartMediaUpload({
  onFilesChange,
  maxFiles = 8,
  maxSizePerFile = 15,
  enableVoiceToText = true,
  enableAutoCompression = true,
  acceptedTypes = ['image/*', 'audio/*', 'application/pdf'],
  className = ''
}: SmartMediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-compression for images
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Generate thumbnail
  const generateThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 100;
          canvas.height = 100;
          ctx?.drawImage(img, 0, 0, 100, 100);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
          URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('audio/')) {
        resolve(''); // Audio files don't need thumbnails
      } else {
        resolve(''); // Default for other file types
      }
    });
  }, []);

  // Voice-to-text transcription (mock implementation)
  const transcribeAudio = useCallback(async (file: File): Promise<string> => {
    if (!enableVoiceToText) return '';
    
    // TODO: Implement actual voice-to-text service
    // For now, return a mock transcription
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('Transcription: Customer reports battery not charging properly...');
      }, 2000);
    });
  }, [enableVoiceToText]);

  // Process uploaded files
  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = [];
    
    for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
      const file = fileList[i];
      
      // Check file size
      if (file.size > maxSizePerFile * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Max size: ${maxSizePerFile}MB`);
        continue;
      }
      
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${i}`,
        file: file,
        type: file.type.startsWith('image/') ? 'photo' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        uploadProgress: 0
      };
      
      try {
        // Generate thumbnail
        if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
          mediaFile.thumbnail = await generateThumbnail(file);
        }
        
        // Auto-compress images if enabled
        if (enableAutoCompression && file.type.startsWith('image/')) {
          const compressedFile = await compressImage(file);
          if (compressedFile.size < file.size) {
            mediaFile.file = compressedFile;
            mediaFile.compressed = true;
          }
        }
        
        // Transcribe audio if enabled
        if (enableVoiceToText && file.type.startsWith('audio/')) {
          mediaFile.transcription = await transcribeAudio(file);
        }
        
        newFiles.push(mediaFile);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Error processing file "${file.name}"`);
      }
    }
    
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, maxFiles, maxSizePerFile, enableAutoCompression, enableVoiceToText, compressImage, generateThumbnail, transcribeAudio, onFilesChange]);

  // File input change handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Camera capture
  const handleCameraCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // TODO: Implement camera capture modal
      // For now, just trigger file input
      fileInputRef.current?.click();
    } catch (error) {
      toast.error('Camera access denied or unavailable');
    }
  }, []);

  // Voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `voice-note-${Date.now()}.wav`, {
          type: 'audio/wav',
          lastModified: Date.now()
        });
        
        const fileList = new DataTransfer();
        fileList.items.add(file);
        processFiles(fileList.files);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
      
    } catch (error) {
      toast.error('Microphone access denied or unavailable');
    }
  }, [processFiles]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isRecording]);

  // Remove file
  const removeFile = useCallback((id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, onFilesChange]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= maxFiles}
              >
                <IconUpload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCameraCapture}
                disabled={files.length >= maxFiles}
              >
                <IconCamera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={files.length >= maxFiles}
              >
                {isRecording ? (
                  <>
                    <IconPlayerStop className="h-4 w-4 mr-2" />
                    Stop ({recordingTime}s)
                  </>
                ) : (
                  <>
                    <IconMicrophone className="h-4 w-4 mr-2" />
                    Voice Note
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Drop files here or use the buttons above. Max {maxFiles} files, {maxSizePerFile}MB each.
            </p>
            
            <p className="text-xs text-muted-foreground">
              {enableAutoCompression && 'Auto-compression enabled. '}
              {enableVoiceToText && 'Voice-to-text transcription enabled.'}
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Attached Files ({files.length}/{maxFiles})
            </h4>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  onFilesChange([]);
                }}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* File Icon/Thumbnail */}
                      <div className="flex-shrink-0">
                        {file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt={file.file.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            {file.type === 'photo' && <IconPhoto className="h-4 w-4" />}
                            {file.type === 'audio' && <IconMicrophone className="h-4 w-4" />}
                            {file.type === 'document' && <IconUpload className="h-4 w-4" />}
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {file.file.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {file.type}
                          </Badge>
                          {file.compressed && (
                            <Badge variant="secondary" className="text-xs">
                              Compressed
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </p>
                        
                        {/* Transcription */}
                        {file.transcription && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            &quot;{file.transcription}&quot;
                          </p>
                        )}
                        
                        {/* Upload Progress */}
                        {typeof file.uploadProgress === 'number' && file.uploadProgress < 100 && (
                          <div className="mt-2">
                            <Progress value={file.uploadProgress} className="h-1" />
                          </div>
                        )}
                      </div>
                      
                      {/* Status & Actions */}
                      <div className="flex items-center gap-2">
                        {file.uploaded ? (
                          <IconCheck className="h-4 w-4 text-green-600" />
                        ) : file.error ? (
                          <IconX className="h-4 w-4 text-red-600" />
                        ) : typeof file.uploadProgress === 'number' ? (
                          <IconLoader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <IconX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
