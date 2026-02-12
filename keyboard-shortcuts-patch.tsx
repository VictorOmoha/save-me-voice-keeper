// Keyboard shortcuts handler - to be inserted before "return (<>" in BrainDump.tsx

// Keyboard shortcuts handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (e.key === 'Escape') {
        setEditingField(null);
      }
      return;
    }

    // Ctrl+Space: Start/Stop recording
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      if (isListening) {
        stop();
        speak('Recording stopped');
      } else {
        start();
        speak('Recording started');
      }
    }
    // Ctrl+Shift+E: Export to email
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      if (hasStructured) {
        handleEmailExport();
      } else {
        toast.info('Process your brain dump first');
      }
    }
    // Ctrl+Shift+L: Export to LinkedIn
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      if (hasStructured) {
        handleLinkedInExport();
      } else {
        toast.info('Process your brain dump first');
      }
    }
    // Ctrl+Shift+D: Download
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (hasStructured) {
        handleDownload();
      } else {
        toast.info('Process your brain dump first');
      }
    }
    // ? : Show shortcuts dialog
    else if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      setShowShortcuts(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isListening, hasStructured, stop, start]);

// Export handlers
const handleEmailExport = () => {
  const shareData = {
    title: title || 'Brain Dump',
    category,
    actionItems,
    keyPoints,
    notes,
    people,
    tags,
    confidence,
    originalText: rawText || transcript
  };
  try {
    openEmailClient(shareData);
    toast.success('Email client opened');
  } catch {
    const content = generateEmailContent(shareData);
    exportToClipboard(content);
    toast.success('Email content copied to clipboard');
  }
};

const handleLinkedInExport = () => {
  const shareData = {
    title: title || 'Brain Dump',
    category,
    actionItems,
    keyPoints,
    notes,
    people,
    tags,
    confidence,
    originalText: rawText || transcript
  };
  const content = generateLinkedInPost(shareData);
  exportToClipboard(content);
  toast.success('LinkedIn post copied to clipboard');
  setTimeout(() => {
    window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
  }, 500);
};

const handleDownload = () => {
  const shareData = {
    title: title || 'Brain Dump',
    category,
    actionItems,
    keyPoints,
    notes,
    people,
    tags,
    confidence,
    originalText: rawText || transcript
  };
  downloadAsText(shareData);
  toast.success('Notes downloaded');
};

// Share data construction helper
const getShareData = () => ({
  title: title || 'Brain Dump',
  category,
  actionItems,
  keyPoints,
  notes,
  people,
  tags,
  confidence,
  originalText: rawText || transcript
});
