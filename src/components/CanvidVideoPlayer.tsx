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
    <div className={`${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-white/10 p-2`}>
      <iframe
        src={shareUrl}
        className="w-full h-full rounded-xl"
        frameBorder="0"
        allowFullScreen
        title="Save Me Demo Video"
      />
    </div>
  );
};