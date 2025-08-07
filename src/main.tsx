import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting application render...');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Main.tsx: Root element not found!');
  throw new Error('Root element not found');
}

console.log('Main.tsx: Root element found, creating React root...');
const root = createRoot(rootElement);

console.log('Main.tsx: Rendering App component...');
root.render(<App />);

console.log('Main.tsx: App component rendered successfully');
