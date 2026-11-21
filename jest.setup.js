require('@testing-library/jest-dom');

// React Router 7 uses TextEncoder/TextDecoder, which jsdom does not provide.
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
const fs = require('fs');
const path = require('path');

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
}
if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = jest.fn();
}

// Global failure snapshot helper
global.saveFailureSnapshot = (testName, element = document.body) => {
  const failuresDir = path.resolve(process.cwd(), 'tests', '__failures__');
  if (!fs.existsSync(failuresDir)) {
    fs.mkdirSync(failuresDir, { recursive: true });
  }
  const sanitized = testName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().slice(0, 100);
  const filePath = path.join(failuresDir, `${sanitized}.html`);
  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Snapshot: ${testName}</title>
</head>
<body>
  <h1>Snapshot: ${testName}</h1>
  <p>Timestamp: ${new Date().toISOString()}</p>
  <div id="captured-dom">
    ${element.innerHTML}
  </div>
</body>
</html>`;
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
};
