
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
class MockSpeechRecognition implements SpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  grammars = {} as SpeechGrammarList;
  maxAlternatives = 1;
  serviceURI = '';
  
  start() {}
  stop() {}
  abort() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  
  onstart = null;
  onend = null;
  onresult = null;
  onerror = null;
  onaudiostart = null;
  onaudioend = null;
  onnomatch = null;
  onsoundstart = null;
  onsoundend = null;
  onspeechstart = null;
  onspeechend = null;
}

Object.defineProperty(globalThis, 'SpeechRecognition', {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

Object.defineProperty(globalThis, 'webkitSpeechRecognition', {
  writable: true,
  configurable: true,
  value: MockSpeechRecognition,
});

// Mock window object properties
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: () => {},
    cancel: () => {},
    getVoices: () => [],
  },
});
