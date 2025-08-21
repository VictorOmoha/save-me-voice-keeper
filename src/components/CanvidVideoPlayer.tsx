import React from 'react';

interface CanvidVideoPlayerProps {
  canvidUrl?: string;
  title?: string;
  className?: string;
  loading?: boolean;
}

export const CanvidVideoPlayer: React.FC<CanvidVideoPlayerProps> = ({ 
  canvidUrl = "https://app.canvid.com/",
  title = "Interactive Demo",
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]",
  loading = false
}) => {
  if (loading) {
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
            <h3 className="text-2xl font-bold text-foreground mb-3">Loading Demo...</h3>
            <p className="text-muted-foreground text-sm">
              Please wait while we prepare the interactive demo
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCanvidClick = () => {
    window.open(canvidUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2 cursor-pointer group`}
      onClick={handleCanvidClick}
    >
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm relative">
        <div className="text-center p-8 max-w-md">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Click to watch the interactive demo
          </p>
          <div className="inline-flex items-center text-sm text-primary font-medium">
            <span>Open Interactive Demo</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};