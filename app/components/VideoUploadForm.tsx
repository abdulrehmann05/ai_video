'use client'
import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, Video, X, FileText, AlertCircle, Home, CheckCircle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FormData {
  title: string;
  description: string;
  videoFile: File | null;
}

interface ImageKitUploadResult {
  url: string;
  thumbnailUrl?: string;
  fileId: string;
  name: string;
  size: number;
}

interface ImageKitAuthData {
  publicKey: string;
  signature: string;
  expire: number;
  token: string;
}

const VideoUploadForm: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    videoFile: null
  });
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded mb-4"></div>
            <div className="h-4 bg-slate-700 rounded mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        
        <div className="relative max-w-md w-full">
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Authentication Required</h3>
              <p className="text-slate-200 mb-6">Please sign in to upload videos.</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return false;
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setError('Video file size must be less than 100MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setFormData(prev => ({
        ...prev,
        videoFile: file
      }));
      setError('');
      setSuccess('');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      videoFile: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    setSuccess('');
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadToImageKit = async (file: File): Promise<ImageKitUploadResult> => {
    try {
      // Get ImageKit auth token
      const authResponse = await fetch('/api/imagekit-auth');
      if (!authResponse.ok) {
        throw new Error('Failed to get upload authentication');
      }

      const authData = await authResponse.json();
      console.log('Auth data received:', authData);

      // Extract the authentication parameters and public key
      const { authenticationParameters, publicKey } = authData;

      if (!authenticationParameters || !publicKey) {
        throw new Error('Invalid authentication data received');
      }

      // Create form data for ImageKit upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', `video-${Date.now()}-${file.name}`);
      uploadFormData.append('publicKey', publicKey);
      
      // Add authentication parameters
      if (authenticationParameters.signature) {
        uploadFormData.append('signature', authenticationParameters.signature);
      }
      if (authenticationParameters.expire) {
        uploadFormData.append('expire', authenticationParameters.expire.toString());
      }
      if (authenticationParameters.token) {
        uploadFormData.append('token', authenticationParameters.token);
      }
      
      uploadFormData.append('folder', '/videos');

      // Upload to ImageKit
      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorResult = await uploadResponse.json();
        console.error('ImageKit upload failed:', errorResult);
        throw new Error(errorResult.message || 'Failed to upload video');
      }

      const uploadResult: ImageKitUploadResult = await uploadResponse.json();
      return uploadResult;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new Error('Failed to upload video file');
    }
  };

  const createVideoRecord = async (videoUrl: string, thumbnailUrl: string) => {
    const videoData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      transformation: {
        width: 1080,
        height: 1920,
        quality: 80
      }
    };

    console.log('Sending video data:', videoData);

    const response = await fetch('/api/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error || 'Failed to save video');
    }

    return await response.json();
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a video description');
      return;
    }

    if (!formData.videoFile) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Upload video file to ImageKit
      setUploadProgress(25);
      const uploadResult = await uploadToImageKit(formData.videoFile);
      
      setUploadProgress(75);
      
      // Step 2: Create video record in database
      const videoRecord = await createVideoRecord(
        uploadResult.url,
        uploadResult.thumbnailUrl || uploadResult.url
      );
      
      setUploadProgress(100);
      
      // Success
      setSuccess('Video uploaded successfully! Redirecting to home page...');
      
      // Navigate to home page after 2 seconds to show the new video
      setTimeout(() => {
        router.push('/');
        router.refresh(); // Force refresh to reload the video list
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isFormValid = formData.title.trim() && formData.description.trim() && formData.videoFile && !uploading;

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      <div className="relative max-w-2xl mx-auto">
        {/* Back to Home Link */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>

        {/* Upload Form Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Upload Video</h2>
                <p className="text-slate-200">Share your video content with the world</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Video Title <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 hover:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter a compelling video title"
                  maxLength={100}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white placeholder-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 hover:border-slate-500 resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Describe your video content, what viewers can expect..."
                maxLength={500}
                disabled={uploading}
              />
              <p className="text-xs text-slate-300 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Video Upload Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Video File <span className="text-red-400">*</span>
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              
              {!formData.videoFile ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-blue-400 bg-blue-900/20'
                      : uploading 
                        ? 'border-slate-600 bg-slate-800/50 cursor-not-allowed opacity-50'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                  onDragEnter={uploading ? undefined : handleDragEnter}
                  onDragLeave={uploading ? undefined : handleDragLeave}
                  onDragOver={uploading ? undefined : handleDragOver}
                  onDrop={uploading ? undefined : handleDrop}
                  onClick={uploading ? undefined : openFileDialog}
                >
                  <Video className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-slate-200">
                      {dragActive ? 'Drop your video here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-slate-300">
                      MP4, MOV, AVI, WMV up to 100MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-600 rounded-xl p-4 bg-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Video className="h-8 w-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100 truncate max-w-xs">
                          {formData.videoFile.name}
                        </p>
                        <p className="text-xs text-slate-300">
                          {formatFileSize(formData.videoFile.size)}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20 transition-colors duration-200"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">Uploading...</span>
                  <span className="text-slate-200">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  !isFormValid
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-[1.02]'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="cursor-pointer flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload Video</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadForm;