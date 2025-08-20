import React from 'react';

interface CanvidVideoPlayerProps {
  videoId: string;
  className?: string;
}

export const CanvidVideoPlayer: React.FC<CanvidVideoPlayerProps> = ({ 
  videoId, 
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" 
}) => {
  const shareUrl = `https://app.canvid.com/share/${videoId}`;

  return (
    <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2`}>
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Watch Demo Video</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Click below to watch the Save Me app demo and see how it works.
          </p>
          <a 
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 font-medium shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
            </svg>
            Watch Demo Video
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-1M14 6h5m0 0v5m0-5L9 16" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};