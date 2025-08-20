import React, { useEffect } from 'react';

interface CanvidVideoPlayerProps {
  videoId: string;
  className?: string;
}

export const CanvidVideoPlayer: React.FC<CanvidVideoPlayerProps> = ({ 
  videoId, 
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]" 
}) => {
  const shareUrl = `https://app.canvid.com/share/${videoId}`;
  const embedUrl = `https://app.canvid.com/embed/${videoId}`;

  useEffect(() => {
    // Auto-show fallback if iframe fails to load properly
    const timer = setTimeout(() => {
      const iframe = document.getElementById('canvid-iframe');
      const fallback = document.getElementById('canvid-fallback');
      
      if (iframe && fallback) {
        const rect = iframe.getBoundingClientRect();
        console.log('🔍 Canvid iframe check:', { width: rect.width, height: rect.height });
        
        // If iframe is very small or zero-sized, it's likely blocked
        if (rect.height <= 150 || rect.width <= 100) {
          console.log('🚨 Canvid iframe blocked, showing fallback');
          fallback.style.opacity = '1';
          fallback.style.pointerEvents = 'auto';
        }
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.log('❌ Canvid iframe error');
    const iframe = e.currentTarget;
    const fallback = document.getElementById('canvid-fallback');
    
    // Try share URL if embed URL fails
    if (iframe.src.includes('/embed/')) {
      console.log('🔄 Trying share URL');
      iframe.src = shareUrl;
    } else if (fallback) {
      console.log('🚨 Both URLs failed, showing fallback');
      fallback.style.opacity = '1';
      fallback.style.pointerEvents = 'auto';
    }
  };

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.log('✅ Canvid iframe loaded');
    const iframe = e.currentTarget;
    
    // Check if iframe actually contains content
    setTimeout(() => {
      const rect = iframe.getBoundingClientRect();
      if (rect.height <= 150) {
        console.log('⚠️ Iframe loaded but appears empty, trying share URL');
        if (iframe.src.includes('/embed/')) {
          iframe.src = shareUrl;
        }
      }
    }, 2000);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 p-2">
      {/* Iframe with multiple fallback strategies */}
      <iframe
        id="canvid-iframe"
        src={embedUrl}
        className={`${className} rounded-xl border-0`}
        frameBorder="0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        title="Save Me Demo Video"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      
      {/* Beautiful fallback UI */}
      <div 
        id="canvid-fallback"
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl transition-all duration-500 pointer-events-none" 
        style={{ opacity: 0 }}
      >
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Demo Video Available</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Due to security restrictions, the video player can't embed here. Click below to watch the demo.
          </p>
          <a 
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 font-medium shadow-lg hover:shadow-xl pointer-events-auto"
            onClick={() => console.log('🔗 Opening Canvid video in new tab')}
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