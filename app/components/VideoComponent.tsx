'use client';

import Link from "next/link";
import { IVideo } from "@/models/Video";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface VideoComponentProps {
  video: IVideo;
  onVideoDeleted?: (videoId: string) => void;
}

export default function VideoComponent({ video, onVideoDeleted }: VideoComponentProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!video._id) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/video/${video._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.status}`);
      }

      console.log('Video deleted successfully');
      
      // Call the callback to update the parent component
      if (onVideoDeleted) {
        onVideoDeleted(video._id.toString());
      }
      
      setShowConfirm(false);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative">
      {/* Delete Button - appears on hover */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg shadow-lg transition-colors duration-200"
          title="Delete video"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-75 rounded-2xl flex items-center justify-center z-20">
          <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 m-4 max-w-sm">
            <h3 className="text-white font-bold text-lg mb-3">Delete Video?</h3>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to delete "{video.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <figure className="relative px-4 pt-4">
        {/* OPTION 1: Remove Link wrapper completely */}
        <div className="relative group w-full">
          <div
            className="rounded-xl overflow-hidden relative w-full"
            style={{ aspectRatio: "9/16" }}
          >
            <video
              src={video.videoUrl}
              poster={video.thumbnailUrl}
              controls={video.controls}
              className="w-full h-full object-cover"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </figure>

      <div className="p-4">
        {/* Remove this Link too if you want no click functionality at all */}
        <Link
          href={`/videos/${video._id}`}
          className="hover:opacity-80 transition-opacity"
        >
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-2">{video.title}</h2>
        </Link>

        <p className="text-sm text-slate-300 line-clamp-2">
          {video.description}
        </p>
      </div>
    </div>
  );
}