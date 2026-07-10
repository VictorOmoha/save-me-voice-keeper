
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

// jsdom does not implement canvas rendering. Voice UI tests only need a
// harmless drawing surface so component effects can mount and clean up.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({
    beginPath: () => {},
    clearRect: () => {},
    lineTo: () => {},
    moveTo: () => {},
    setTransform: () => {},
    stroke: () => {},
    globalAlpha: 1,
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: '',
    strokeStyle: '',
  } as unknown as CanvasRenderingContext2D),
});
