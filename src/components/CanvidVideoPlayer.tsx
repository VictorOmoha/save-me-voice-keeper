import React, { useState } from 'react';

interface CanvidVideoPlayerProps {
  videoUrl?: string;
  title?: string;
  className?: string;
  loading?: boolean;
}

export const CanvidVideoPlayer: React.FC<CanvidVideoPlayerProps> = ({ 
  videoUrl,
  title = "Demo Video",
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]",
  loading = false
}) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  if (loading || !videoUrl) {
    return (
      <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2`}>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary/60 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Loading Video...</h3>
            <p className="text-muted-foreground text-sm">
              Please wait while we prepare the demo
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-destructive/5 to-destructive/10 dark:from-destructive/10 dark:to-destructive/5 p-2`}>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-16 h-16 bg-destructive/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.734 0L3.078 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Video Unavailable</h3>
            <p className="text-muted-foreground text-sm">
              The demo video couldn't be loaded. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2`}>
      {isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background/80 to-background/60 dark:from-background/80 dark:to-background/60 rounded-xl backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Loading video...</p>
          </div>
        </div>
      )}
      <video
        className="w-full h-full rounded-xl object-cover"
        controls
        preload="metadata"
        poster=""
        onLoadStart={() => setIsVideoLoading(true)}
        onCanPlay={() => setIsVideoLoading(false)}
        onError={() => {
          setVideoError(true);
          setIsVideoLoading(false);
        }}
        onLoad={() => setIsVideoLoading(false)}
      >
        <source src={videoUrl} type="video/mp4" />
        <p className="text-muted-foreground">
          Your browser doesn't support video playback. 
          <a href={videoUrl} className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
            Download the video
          </a>
        </p>
      </video>
    </div>
  );
};