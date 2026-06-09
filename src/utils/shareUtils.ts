// Share utilities for SaveMe.Space
// Generate shareable content from brain dump data

import { ActionItem } from "./brainDumpProcessor";

export interface ShareData {
  title: string;
  category: string;
  actionItems: ActionItem[];
  keyPoints: string[];
  notes: string[];
  people: string[];
  tags: string[];
  confidence: number | null;
  originalText: string;
}

// Generate professional email content
export function generateEmailContent(data: ShareData, format: 'formatted' | 'plain' = 'formatted'): string {
  const { title, category, actionItems, keyPoints, notes, people, tags, originalText } = data;
  
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let content = '';
  
  if (format === 'formatted') {
    content = `Subject: ${title || 'Brain Dump Notes'} - ${date}

Hi,

I wanted to share my notes from our conversation:

${originalText ? `"${originalText.substring(0, 200)}${originalText.length > 200 ? '...' : ''}"\n\n` : ''}`;

    if (actionItems.length > 0) {
      content += `ACTION ITEMS:\n`;
      actionItems.forEach((item, i) => {
        const priority = item.priority ? `[${item.priority.toUpperCase()}] ` : '';
        const due = item.dueDate ? ` (Due: ${item.dueDate})` : '';
        content += `${i + 1}. ${priority}${item.text}${due}\n`;
      });
      content += `\n`;
    }

    if (keyPoints.length > 0) {
      content += `KEY POINTS:\n`;
      keyPoints.forEach((point, i) => {
        content += `• ${point}\n`;
      });
      content += `\n`;
    }

    if (notes.length > 0) {
      content += `NOTES:\n`;
      notes.forEach((note, i) => {
        content += `• ${note}\n`;
      });
      content += `\n`;
    }

    if (people.length > 0) {
      content += `PEOPLE: ${people.join(', ')}\n\n`;
    }

    if (tags.length > 0) {
      content += `TAGS: ${tags.join(', ')}\n\n`;
    }

    content += `Category: ${category}
Captured using SaveMe.Space — voice-powered personal knowledge vault
`;
  } else {
    // Plain format
    content = `${title || 'Brain Dump'}\n\n`;
    if (actionItems.length > 0) {
      content += `Actions:\n${actionItems.map((a, i) => `${i + 1}. ${a.text}`).join('\n')}\n\n`;
    }
    if (keyPoints.length > 0) {
      content += `Key Points:\n${keyPoints.map(k => `• ${k}`).join('\n')}\n\n`;
    }
  }

  return content;
}

// Generate LinkedIn post content
export function generateLinkedInPost(data: ShareData): string {
  const { title, actionItems, keyPoints, category } = data;
  
  let content = `📝 Quick capture from my ${category.toLowerCase()} notes:\n\n`;
  
  content += `"${title || 'Key insights'}"\n\n`;
  
  if (keyPoints.length > 0) {
    keyPoints.forEach(point => {
      content += `✓ ${point}\n`;
    });
    content += '\n';
  }
  
  if (actionItems.length > 0) {
    content += `Next:`;
    actionItems.slice(0, 2).forEach(item => {
      content += ` ${item.text} →`;
    });
    content = content.slice(0, -3) + '\n\n';
  }
  
  content += `How I capture ideas: voice → structure → action. No typing. @SaveMe.Space\n\n#productivity #voicefirst #entrepreneurship`;
  
  return content;
}

// Generate a summary card (for social sharing)
export function generateShareCard(data: ShareData): {
  title: string;
  subtitle: string;
  stats: string[];
  color: string;
} {
  const { title, actionItems, keyPoints, notes, category } = data;
  
  const itemCount = actionItems.length + keyPoints.length + notes.length;
  const hasActions = actionItems.length > 0;
  
  const colors: Record<string, string> = {
    'Work': '#3B82F6',
    'Personal': '#10B981',
    'Health': '#EF4444',
    'Finance': '#F59E0B',
    'Documents': '#8B5CF6',
  };
  
  return {
    title: title || `${category} Notes`,
    subtitle: `${itemCount} items captured`,
    stats: [
      actionItems.length > 0 ? `${actionItems.length} actions` : '',
      keyPoints.length > 0 ? `${keyPoints.length} insights` : '',
      notes.length > 0 ? `${notes.length} notes` : '',
    ].filter(Boolean),
    color: colors[category] || '#6366F1',
  };
}

// Export to clipboard
export async function exportToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

// Open email client
export function openEmailClient(data: ShareData): void {
  const content = generateEmailContent(data, 'formatted');
  const subject = encodeURIComponent(data.title || 'Brain Dump Notes');
  const body = encodeURIComponent(content);
  
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  
  // Open email client
  try {
    window.location.href = mailtoLink;
  } catch (err) {
    // Fallback: copy to clipboard
    exportToClipboard(content);
    alert('Email content copied to clipboard! Paste into your email client.');
  }
}

// Download as text file
export function downloadAsText(data: ShareData): void {
  const content = generateEmailContent(data, 'plain');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Keyboard shortcuts helper
export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  NEW_CAPTURE: { key: 'n', ctrl: true, description: 'New capture (Ctrl+N)' },
  START_RECORDING: { key: ' ', ctrl: true, description: 'Start/stop recording (Ctrl+Space)' },
  PROCESS: { key: 'p', ctrl: true, description: 'Process brain dump (Ctrl+P)' },
  SAVE: { key: 's', ctrl: true, description: 'Save entry (Ctrl+S)' },
  EXPORT_EMAIL: { key: 'e', ctrl: true, shift: true, description: 'Export to email (Ctrl+Shift+E)' },
  EXPORT_LINKEDIN: { key: 'l', ctrl: true, shift: true, description: 'Export to LinkedIn (Ctrl+Shift+L)' },
  RESET: { key: 'Escape', description: 'Reset/Go back (Esc)' },
};

// Check if shortcut matches
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS]
): boolean {
  if (event.key !== shortcut.key) return false;
  if ('ctrl' in shortcut && shortcut.ctrl && !event.ctrlKey && !event.metaKey) return false;
  if ('shift' in shortcut && shortcut.shift && !event.shiftKey) return false;
  return true;
}
