'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconPhoto,
  IconMicrophone,
  IconFileUpload,
  IconX,
  IconEye,
  IconTrash,
  IconCamera,
  IconBattery,
  IconCar,
  IconCheck,
  IconLoader2
} from '@tabler/icons-react';
import { toast } from 'sonner';

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'photo' | 'audio' | 'document';
  category: 'vehicle' | 'battery' | 'general';
  batteryIndex?: number; // For battery-specific uploads
  required?: boolean;
  uploaded?: boolean;
  uploading?: boolean;
}

interface EnhancedMediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  showBatteryOptions?: boolean;
  batteryCount?: number;
  maxFiles?: number;
  maxSizePerFile?: number; // MB
  className?: string;
}

// Required vehicle photos for complete documentation
const REQUIRED_VEHICLE_PHOTOS = [
  { id: 'front', label: 'Front View', icon: IconCamera },
  { id: 'rear', label: 'Rear View', icon: IconCamera },
  { id: 'left', label: 'Left Side', icon: IconCamera },
  { id: 'right', label: 'Right Side', icon: IconCamera }
];

export function EnhancedMediaUpload({
  onFilesChange,
  showBatteryOptions = false,
  batteryCount = 0,
  maxFiles = 15,
  maxSizePerFile = 10,
  className = ''
}: EnhancedMediaUploadProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeTab, setActiveTab] = useState('vehicle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCategory, setRecordingCategory] = useState<'vehicle' | 'battery' | 'general'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  // Get required photos completion status
  const requiredPhotos = REQUIRED_VEHICLE_PHOTOS.map(photo => ({
    ...photo,
    completed: files.some(f => 
      f.category === 'vehicle' && 
      f.type === 'photo' && 
      f.id.includes(photo.id)
    )
  }));

  const allRequiredPhotosCompleted = requiredPhotos.every(p => p.completed);

  const handleFileSelect = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    category: 'vehicle' | 'battery' | 'general' = 'general',
    batteryIndex?: number
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: MediaFile[] = [];

    selectedFiles.forEach(file => {
      if (file.size > maxSizePerFile * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large. Maximum size is ${maxSizePerFile}MB`);
        return;
      }

      const fileType = file.type.startsWith('image/') ? 'photo' : 
                      file.type.startsWith('audio/') ? 'audio' : 'document';
      
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: fileType === 'photo' ? URL.createObjectURL(file) : '',
        type: fileType,
        category,
        batteryIndex,
        uploaded: false,
        uploading: false
      };

      newFiles.push(mediaFile);
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, maxFiles, maxSizePerFile, onFilesChange]);

  const handleRequiredPhotoUpload = (photoType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > maxSizePerFile * 1024 * 1024) {
        toast.error(`File is too large. Maximum size is ${maxSizePerFile}MB`);
        return;
      }

      const mediaFile: MediaFile = {
        id: `vehicle-${photoType}-${Date.now()}`,
        file,
        preview: URL.createObjectURL(file),
        type: 'photo',
        category: 'vehicle',
        required: true,
        uploaded: false,
        uploading: false
      };

      const updatedFiles = [...files, mediaFile];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    };

    input.click();
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);

    // Revoke object URL to free memory
    const file = files.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
  };

  const startRecording = async (category: 'vehicle' | 'battery' | 'general' = 'general') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordingBlob(blob);
        
        const audioFile = new File([blob], `recording-${Date.now()}.wav`, {
          type: 'audio/wav'
        });

        const mediaFile: MediaFile = {
          id: `audio-${Date.now()}`,
          file: audioFile,
          preview: '',
          type: 'audio',
          category,
          uploaded: false,
          uploading: false
        };

        const updatedFiles = [...files, mediaFile];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        // Stop all tracks to free the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingCategory(category);
    } catch (error) {
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const getCategoryFiles = (category: 'vehicle' | 'battery' | 'general', batteryIndex?: number) => {
    return files.filter(f => 
      f.category === category && 
      (category !== 'battery' || f.batteryIndex === batteryIndex)
    );
  };

  const getCategoryStats = (category: 'vehicle' | 'battery' | 'general') => {
    const categoryFiles = files.filter(f => f.category === category);
    const photos = categoryFiles.filter(f => f.type === 'photo').length;
    const audio = categoryFiles.filter(f => f.type === 'audio').length;
    const documents = categoryFiles.filter(f => f.type === 'document').length;
    
    return { total: categoryFiles.length, photos, audio, documents };
  };

  const renderFilePreview = (file: MediaFile) => (
    <motion.div
      key={file.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      <Card className="overflow-hidden">
        <div className="aspect-square relative">
          {file.type === 'photo' ? (
            <img
              src={file.preview}
              alt={file.file.name}
              className="w-full h-full object-cover"
            />
          ) : file.type === 'audio' ? (
            <div className="flex flex-col items-center justify-center h-full bg-purple-50">
              <IconMicrophone className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-xs text-purple-700 font-medium">Audio</span>
              <span className="text-xs text-purple-600 truncate px-2">
                {file.file.name}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-blue-50">
              <IconFileUpload className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-xs text-blue-700 font-medium">Document</span>
              <span className="text-xs text-blue-600 truncate px-2">
                {file.file.name}
              </span>
            </div>
          )}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {file.type === 'photo' && (
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <IconEye className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-8 w-8 p-0"
              onClick={() => handleRemoveFile(file.id)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>

          {/* Status indicators */}
          {file.uploaded && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <IconCheck className="h-3 w-3" />
            </div>
          )}
          {file.uploading && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
              <IconLoader2 className="h-3 w-3 animate-spin" />
            </div>
          )}
          {file.required && (
            <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
              Required
            </Badge>
          )}
        </div>
        
        <CardContent className="p-2">
          <p className="text-xs font-medium truncate">{file.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.file.size / 1024).toFixed(1)} KB
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <IconCar className="h-4 w-4" />
            Vehicle
            {getCategoryStats('vehicle').total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getCategoryStats('vehicle').total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="battery" disabled={!showBatteryOptions} className="flex items-center gap-2">
            <IconBattery className="h-4 w-4" />
            Battery
            {getCategoryStats('battery').total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getCategoryStats('battery').total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <IconFileUpload className="h-4 w-4" />
            General
            {getCategoryStats('general').total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getCategoryStats('general').total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCar className="h-5 w-5" />
                Vehicle Documentation
                {allRequiredPhotosCompleted && (
                  <Badge variant="default" className="ml-auto">
                    <IconCheck className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Required Photos */}
              <div>
                <h4 className="text-sm font-medium mb-3">Required Photos (4)</h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {REQUIRED_VEHICLE_PHOTOS.map((photo) => {
                    const isCompleted = requiredPhotos.find(p => p.id === photo.id)?.completed;
                    return (
                      <Button
                        key={photo.id}
                        variant={isCompleted ? "default" : "outline"}
                        className="h-24 flex-col gap-2"
                        onClick={() => handleRequiredPhotoUpload(photo.id)}
                      >
                        {isCompleted ? (
                          <IconCheck className="h-6 w-6" />
                        ) : (
                          <photo.icon className="h-6 w-6" />
                        )}
                        <span className="text-xs">{photo.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Vehicle Media */}
              <div>
                <h4 className="text-sm font-medium mb-3">Additional Vehicle Media</h4>
                <div className="flex gap-2 mb-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,audio/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'vehicle')}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <IconPhoto className="h-4 w-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => isRecording ? stopRecording() : startRecording('vehicle')}
                    className={isRecording && recordingCategory === 'vehicle' ? 'bg-red-50 text-red-600' : ''}
                  >
                    <IconMicrophone className="h-4 w-4 mr-2" />
                    {isRecording && recordingCategory === 'vehicle' ? 'Stop' : 'Record'}
                  </Button>
                </div>

                {/* Vehicle Media Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <AnimatePresence>
                    {getCategoryFiles('vehicle').map(renderFilePreview)}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="battery" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBattery className="h-5 w-5" />
                Battery Documentation
                <Badge variant="outline" className="ml-auto">
                  {batteryCount} {batteryCount === 1 ? 'battery' : 'batteries'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showBatteryOptions && batteryCount > 0 ? (
                <div className="space-y-4">
                  {Array.from({ length: batteryCount }, (_, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Battery #{index + 1} Media</h4>
                      <div className="flex gap-2 mb-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*,audio/*';
                            input.onchange = (e) => handleFileSelect(e as any, 'battery', index);
                            input.click();
                          }}
                          className="flex-1"
                        >
                          <IconPhoto className="h-4 w-4 mr-2" />
                          Add Photos
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => startRecording('battery')}
                        >
                          <IconMicrophone className="h-4 w-4 mr-2" />
                          Record
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <AnimatePresence>
                          {getCategoryFiles('battery', index).map(renderFilePreview)}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconBattery className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No batteries added yet.</p>
                  <p className="text-sm">Add batteries first to upload battery-specific media.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileUpload className="h-5 w-5" />
                General Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="general-upload"
                  onChange={(e) => handleFileSelect(e, 'general')}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('general-upload')?.click()}
                  className="flex-1"
                >
                  <IconFileUpload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => isRecording ? stopRecording() : startRecording('general')}
                  className={isRecording && recordingCategory === 'general' ? 'bg-red-50 text-red-600' : ''}
                >
                  <IconMicrophone className="h-4 w-4 mr-2" />
                  {isRecording && recordingCategory === 'general' ? 'Stop' : 'Record'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <AnimatePresence>
                  {getCategoryFiles('general').map(renderFilePreview)}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Bar */}
      {files.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span>
                <strong>{files.length}</strong> files ready for upload
              </span>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{files.filter(f => f.type === 'photo').length} photos</span>
                <span>{files.filter(f => f.type === 'audio').length} audio</span>
                <span>{files.filter(f => f.type === 'document').length} documents</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
