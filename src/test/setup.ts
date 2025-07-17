
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// Mock Speech Recognition API
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  
  start() {}
  stop() {}
  abort() {}
  
  onstart = null;
  onend = null;
  onresult = null;
  onerror = null;
};

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock window object properties
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [],
  },
});
