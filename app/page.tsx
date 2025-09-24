'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Upload, User, LogIn, Home, Video, LogOut } from 'lucide-react';
import VideoFeed from './components/VideoFeed';
import ProtectedRoute from './components/ProtectedRoute';
import { IVideo } from '@/models/Video';

const MainContent = () => {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch videos on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  // Refresh videos when user signs in/out
  useEffect(() => {
    if (status !== 'loading') {
      fetchVideos();
    }
  }, [status]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching videos from /api/video...');
      
      const response = await fetch('/api/video', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get the raw response text first
      const responseText = await response.text();
      console.log('Raw response (first 1000 chars):', responseText.substring(0, 1000));
      
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(`API Error: ${response.status} - ${response.statusText}. Response: ${responseText.substring(0, 200)}`);
      }

      // Check if it's actually JSON
      if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
        console.error('Full HTML response:', responseText);
        throw new Error('API route returned HTML instead of JSON. This usually means the API route has an error or doesn\'t exist.');
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response that failed to parse:', responseText);
        throw new Error(`Invalid JSON response from API. Response was: ${responseText.substring(0, 200)}`);
      }

      console.log('Parsed data:', data);
      
      // Handle both array and object with error
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      setVideos(Array.isArray(data) ? data : []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError(error instanceof Error ? error.message : 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Handle video deletion from child components
  const handleVideosChange = (updatedVideos: IVideo[]) => {
    setVideos(updatedVideos);
  };

  const handleLogout = async () => {
    try {
      // Sign out and redirect to login page
      const result = await signOut({ 
        redirect: false,
        callbackUrl: '/login' 
      });
      
      // Force a redirect to login page
      window.location.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect to login even if signOut fails
      window.location.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      
      {/* Header */}
      <header className="relative bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200">
                    Video with AI
                  </h1>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm hidden sm:block">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Latest Videos</h2>
                <p className="text-white">
                  Discover amazing video content shared by our community
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Refresh Button */}
                <button
                  onClick={fetchVideos}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  <Home className="w-4 h-4" />
                  Refresh
                </button>
                
                {session && (
                  <Link
                    href="/upload"
                    className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload Video</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats or Info Bar */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{videos.length}</div>
                    <div className="text-xs text-white">Total Videos</div>
                  </div>
                  <div className="w-px h-8 bg-slate-600"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">AI</div>
                    <div className="text-xs text-white">Powered</div>
                  </div>
                </div>
                
                <div className="hidden md:flex items-center space-x-2 text-sm text-white">
                  <Home className="w-4 h-4" />
                  <span>Welcome to Video with AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-200">Loading videos...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-red-400 text-lg font-medium mb-2">Failed to Load Videos</div>
                <p className="text-red-300 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchVideos}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Video Feed */}
          {!loading && !error && (
            <>
              {videos.length > 0 ? (
                <VideoFeed 
                  videos={videos} 
                  onVideosChange={handleVideosChange}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Video className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
                    <p className="text-gray-200 mb-6">
                      Be the first to share amazing video content with our community.
                    </p>
                    <Link
                      href="/upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload Your First Video</span>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const Page = () => {
  return (
    <ProtectedRoute>
      <MainContent />
    </ProtectedRoute>
  );
};

export default Page;