const JSDOMEnvironment = require('jest-environment-jsdom').default || require('jest-environment-jsdom');
const fs = require('fs');
const path = require('path');

class SnapshotOnFailureEnvironment extends JSDOMEnvironment {
  async handleTestEvent(event, state) {
    if (event.name === 'test_done' && event.test.errors && event.test.errors.length > 0) {
      try {
        const failuresDir = path.resolve(this.global.process.cwd(), 'tests', '__failures__');
        if (!fs.existsSync(failuresDir)) {
          fs.mkdirSync(failuresDir, { recursive: true });
        }
        const testName = event.test.name || 'unnamed_test';
        const sanitized = testName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().slice(0, 100);
        const filePath = path.join(failuresDir, `${sanitized}.html`);
        const domContent = this.dom && this.dom.window && this.dom.window.document && this.dom.window.document.body
          ? this.dom.window.document.body.innerHTML
          : '<empty-dom>';
        
        const errorDetails = event.test.errors.map(err => {
          if (Array.isArray(err)) return err.map(e => e.message || String(e)).join('\n');
          return err.message || err.stack || String(err);
        }).join('\n\n');
        
        const fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Failure Snapshot: ${testName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; line-height: 1.5; color: #1e293b; }
    .error-box { background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-family: monospace; white-space: pre-wrap; font-size: 13px; }
    .dom-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; background: #f8fafc; }
  </style>
</head>
<body>
  <h1>Failure Snapshot: ${testName}</h1>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  <div class="error-box"><strong>Error Output:</strong>\n${errorDetails}</div>
  <h2>Rendered DOM at Failure:</h2>
  <div class="dom-box">
    ${domContent}
  </div>
</body>
</html>`;
        fs.writeFileSync(filePath, fileContent, 'utf8');
      } catch (err) {
        console.error('Failed to write failure snapshot:', err);
      }
    }
    if (super.handleTestEvent) {
      await super.handleTestEvent(event, state);
    }
  }
}

module.exports = SnapshotOnFailureEnvironment;
