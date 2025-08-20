import React from 'react';

interface CanvidVideoPlayerProps {
  videoId: string;
  className?: string;
}

export const CanvidVideoPlayer: React.FC<CanvidVideoPlayerProps> = ({ 
  videoId, 
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" 
}) => {
  const videoUrl = `https://app.canvid.com/embed/${videoId}`;

  return (
    <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2 cursor-pointer group`}>
      <div 
        onClick={() => window.open(videoUrl, '_blank', 'noopener,noreferrer')}
        className="flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm"
      >
        <div className="text-center p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/30 transition-colors duration-300">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Watch Demo Video</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            See Save Me in action - click to watch the interactive demo
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium shadow-lg group-hover:shadow-xl">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Video
          </div>
        </div>
      </div>
    </div>
  );
};