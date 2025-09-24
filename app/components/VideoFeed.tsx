'use client';

import { useState, useEffect } from "react";
import { IVideo } from "@/models/Video";
import VideoComponent from "./VideoComponent";

interface VideoFeedProps {
  videos: IVideo[];
  onVideosChange?: (videos: IVideo[]) => void;
}

export default function VideoFeed({ videos: initialVideos, onVideosChange }: VideoFeedProps) {
  const [videos, setVideos] = useState<IVideo[]>(initialVideos);

  // Update local state when props change
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  const handleVideoDeleted = (deletedVideoId: string) => {
    const updatedVideos = videos.filter(video => 
      video._id?.toString() !== deletedVideoId
    );
    setVideos(updatedVideos);
    
    // Notify parent component if callback provided
    if (onVideosChange) {
      onVideosChange(updatedVideos);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div key={video._id?.toString()} className="group">
          <VideoComponent 
            video={video} 
            onVideoDeleted={handleVideoDeleted}
          />
        </div>
      ))}

      {videos.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-white text-lg">No videos found</p>
        </div>
      )}
    </div>
  );
}