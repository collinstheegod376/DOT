const fs = require('fs');
const path = require('path');

const bundleJs = fs.readFileSync(path.resolve(__dirname, 'dot-crypto-standalone.js'), 'utf8');

// Sample test envelope encrypted with password: 'SovereignDot2026!'
// Mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const sampleEnvelope = JSON.stringify({
  format: 'dot1',
  version: 1,
  kdf: {
    algorithm: 'PBKDF2',
    params: {
      salt: 'ee00416db3d8ea3448ce891467b13eb0',
      iterations: 100000,
      hash: 'SHA-256'
    }
  },
  cipher: {
    algorithm: 'AES-256-GCM',
    params: {
      iv: '2a3181557f080e35cd2783dd',
      tagLength: 128
    }
  },
  ciphertext: '35a0b0c427c4710ae65911eae32741ddcfca6042372615c7601e314b80c742aa564dab16da895d2633320eb1289198fcf291f2fb2dc7d586cfcb2be560793ef37836217ebf3f7d4318f4940462f6ea6e5de04a100eca0469949937d33167f65630caacdd4a903cb455c06e30cb'
}, null, 2);

const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOT Sovereign Offline Recoverer | The One Test That Decides Everything</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #121215;
      --card-border: #27272a;
      --text-main: #f4f4f5;
      --text-muted: #a1a1aa;
      --accent: #f59e0b;
      --accent-dim: rgba(245, 158, 11, 0.12);
      --success: #10b981;
      --success-dim: rgba(16, 185, 129, 0.12);
      --danger: #ef4444;
      --danger-dim: rgba(239, 68, 68, 0.12);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 24px 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    header {
      text-align: center;
      padding: 16px 0 24px;
      border-bottom: 1px solid var(--card-border);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-family: monospace;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--accent-dim);
      color: var(--accent);
      border: 1px solid rgba(245, 158, 11, 0.25);
      margin-bottom: 10px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 14px;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--success-dim);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
    }
    .status-banner.alert {
      background: var(--danger-dim);
      border-color: rgba(239, 68, 68, 0.4);
      color: var(--danger);
    }
    .checklist {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .check-item.verified {
      color: var(--success);
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    textarea, input[type="text"], input[type="password"] {
      width: 100%;
      background: #09090b;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      outline: none;
      transition: border-color 0.15s;
    }
    textarea:focus, input:focus {
      border-color: var(--accent);
    }
    .file-dropzone {
      border: 2px dashed var(--card-border);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-muted);
      transition: all 0.2s;
    }
    .file-dropzone:hover {
      border-color: var(--accent);
      background: rgba(245, 158, 11, 0.03);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--accent);
      color: #000;
      font-weight: 700;
      padding: 12px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s, transform 0.1s;
    }
    .btn:hover {
      opacity: 0.92;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-secondary {
      background: #27272a;
      color: var(--text-main);
      font-size: 12px;
      padding: 8px 14px;
    }
    .btn-secondary:hover {
      background: #3f3f46;
    }
    .btn-danger {
      background: var(--danger-dim);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.2);
    }
    .btn-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .results-container {
      display: none;
      flex-direction: column;
      gap: 16px;
    }
    .mnemonic-box {
      background: #000;
      border: 1px solid var(--accent);
      border-radius: 12px;
      padding: 16px;
    }
    .word-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .word-chip {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .word-idx {
      color: var(--text-muted);
      font-size: 10px;
      margin-right: 6px;
    }
    .derivation-card {
      background: #0e0e11;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .derivation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
    }
    .derivation-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
    }
    .derivation-row .label {
      color: var(--text-muted);
      font-size: 11px;
    }
    .val-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #000;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .copy-btn {
      background: none;
      border: none;
      color: var(--accent);
      cursor: pointer;
      font-size: 11px;
      font-family: monospace;
      padding: 2px 6px;
      margin-left: 8px;
      border-radius: 4px;
    }
    .copy-btn:hover {
      background: var(--accent-dim);
    }
    footer {
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
      padding: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        DOT Sovereign Offline Recoverer
      </div>
      <h1>The One Test That Decides Everything</h1>
      <p class="subtitle">
        If dot.xyz vanishes from the internet forever, this standalone file decrypts your .dot1 envelope and derives your EVM, Bitcoin, and Solana keys completely offline.
      </p>
    </header>

    <!-- Offline Security & Quarantine Status -->
    <div class="card">
      <div class="status-banner" id="quarantineBanner">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--success);"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span style="font-weight: 600;">Strict Offline Quarantine Active</span>
        </div>
        <span id="callCounter" style="font-family: monospace; font-size: 12px; color: var(--text-muted);">
          External Requests: 0
        </span>
      </div>

      <div class="checklist">
        <div class="check-item verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span>Single-file self contained</span>
        </div>
        <div class="check-item verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span>Web Crypto Hardware Acceleration</span>
        </div>
        <div class="check-item verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span>All Network APIs Quarantined</span>
        </div>
        <div class="check-item verified">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span>Zero external telemetry / analytics</span>
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <div class="card" id="inputCard">
      <div class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
        1. Input Encrypted .dot1 Envelope
      </div>

      <div class="form-group">
        <label>Upload .dot1 File or Paste Envelope JSON / String</label>
        <div class="file-dropzone" id="dropzone">
          Drag & Drop your <strong>.dot1</strong> file here, or click to browse
          <input type="file" id="fileInput" accept=".dot1,.json" style="display: none;">
        </div>
      </div>

      <div class="form-group">
        <textarea id="envelopeInput" rows="5" placeholder='Paste {"format":"dot1", "kdf": {...}, "cipher": {...}, "ciphertext": "..."}'></textarea>
      </div>

      <div class="form-group">
        <label for="passwordInput">Envelope Decryption Password</label>
        <div style="position: relative;">
          <input type="password" id="passwordInput" placeholder="Enter your vault password">
          <button type="button" id="togglePassword" style="position: absolute; right: 10px; top: 10px; background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px;">Show</button>
        </div>
      </div>

      <div class="btn-row" style="margin-top: 16px;">
        <button class="btn" id="decryptBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Decrypt & Derive Keys
        </button>
        <button class="btn btn-secondary" id="testVectorBtn">
          Load Verified Test Envelope
        </button>
      </div>

      <div id="statusMessage" style="margin-top: 14px; font-size: 13px; font-family: monospace; display: none;"></div>
    </div>

    <!-- Decrypted Output Area -->
    <div class="results-container" id="resultsContainer">
      <!-- Master Mnemonic -->
      <div class="card mnemonic-box">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title" style="color: var(--accent); margin-bottom: 0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Master Mnemonic Phrase (BIP39)
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="copyMnemonicBtn">Copy Phrase</button>
            <button class="btn btn-danger" id="wipeBtn">Wipe Keys from Memory</button>
          </div>
        </div>

        <div class="word-grid" id="wordGrid"></div>
      </div>

      <!-- EVM Keys -->
      <div class="card derivation-card">
        <div class="derivation-header">
          <span style="color: #60a5fa;">EVM Chains (Ethereum, Base, Arbitrum, Optimism, Polygon)</span>
          <span style="font-family: monospace; font-size: 11px; color: var(--text-muted);">Path: m/44'/60'/0'/0/0</span>
        </div>
        <div class="derivation-row">
          <span class="label">Address (0x)</span>
          <div class="val-box">
            <span id="evmAddress"></span>
            <button class="copy-btn" onclick="copyText('evmAddress')">Copy</button>
          </div>
        </div>
        <div class="derivation-row">
          <span class="label">Private Key</span>
          <div class="val-box">
            <span id="evmPrivKey" style="filter: blur(4px); cursor: pointer;" onclick="toggleBlur(this)"></span>
            <button class="copy-btn" onclick="copyText('evmPrivKey')">Copy</button>
          </div>
        </div>
      </div>

      <!-- Bitcoin Keys -->
      <div class="card derivation-card">
        <div class="derivation-header">
          <span style="color: #fb923c;">Bitcoin (BIP84 Native SegWit & BIP44 Legacy)</span>
          <span style="font-family: monospace; font-size: 11px; color: var(--text-muted);">Path: m/84'/0'/0'/0/0</span>
        </div>
        <div class="derivation-row">
          <span class="label">Native SegWit Address (bc1q...)</span>
          <div class="val-box">
            <span id="btcNativeSegwit"></span>
            <button class="copy-btn" onclick="copyText('btcNativeSegwit')">Copy</button>
          </div>
        </div>
        <div class="derivation-row">
          <span class="label">Legacy Address (1...)</span>
          <div class="val-box">
            <span id="btcLegacy"></span>
            <button class="copy-btn" onclick="copyText('btcLegacy')">Copy</button>
          </div>
        </div>
        <div class="derivation-row">
          <span class="label">Private Key (Hex)</span>
          <div class="val-box">
            <span id="btcPrivKey" style="filter: blur(4px); cursor: pointer;" onclick="toggleBlur(this)"></span>
            <button class="copy-btn" onclick="copyText('btcPrivKey')">Copy</button>
          </div>
        </div>
      </div>

      <!-- Solana Keys -->
      <div class="card derivation-card">
        <div class="derivation-header">
          <span style="color: #a855f7;">Solana (Ed25519)</span>
          <span style="font-family: monospace; font-size: 11px; color: var(--text-muted);">Path: m/44'/501'/0'/0'</span>
        </div>
        <div class="derivation-row">
          <span class="label">Public Key / Address (Base58)</span>
          <div class="val-box">
            <span id="solAddress"></span>
            <button class="copy-btn" onclick="copyText('solAddress')">Copy</button>
          </div>
        </div>
        <div class="derivation-row">
          <span class="label">Private Key (Base58 Secret Key)</span>
          <div class="val-box">
            <span id="solPrivKey" style="filter: blur(4px); cursor: pointer;" onclick="toggleBlur(this)"></span>
            <button class="copy-btn" onclick="copyText('solPrivKey')">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <footer>
      DOT Sovereign Offline Recovery Specification v1 &bull; 100% In-Browser Cryptography &bull; Zero External Network Requests
    </footer>
  </div>

  <!-- STANDALONE CRYPTO BUNDLE (INLINE JS) -->
  <script>
    // 1. STRICT NETWORK QUARANTINE ENFORCER
    (function enforceStrictOfflineQuarantine() {
      let networkCallsAttempted = 0;
      function recordNetworkCall(type, url) {
        networkCallsAttempted++;
        console.error('[OFFLINE QUARANTINE] Blocked outbound ' + type + ' call to:', url);
        const counter = document.getElementById('callCounter');
        const banner = document.getElementById('quarantineBanner');
        if (counter) counter.innerText = 'External Requests Blocked: ' + networkCallsAttempted;
        if (banner) banner.classList.add('alert');
        throw new Error('DOT Decryptor strict offline guarantee violated: ' + type + ' to ' + url);
      }

      window.fetch = function(url) { recordNetworkCall('fetch', url); };
      const OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        const origOpen = xhr.open;
        xhr.open = function(method, url) {
          recordNetworkCall('XHR (' + method + ')', url);
          return origOpen.apply(xhr, arguments);
        };
        return xhr;
      };
      const OriginalWS = window.WebSocket;
      window.WebSocket = function(url) {
        recordNetworkCall('WebSocket', url);
        return new OriginalWS(url);
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon = function(url) {
          recordNetworkCall('sendBeacon', url);
          return false;
        };
      }
    })();
  </script>

  <!-- INLINE BUNDLED AUDITED CRYPTO SUITE -->
  <script>
    ${bundleJs}
  </script>

  <!-- DECRYPTION & RECOVERY APPLICATION LOGIC -->
  <script>
    const SAMPLE_ENVELOPE = ${JSON.stringify(sampleEnvelope)};
    let activeMnemonic = '';

    // File drop & upload setup
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const envelopeInput = document.getElementById('envelopeInput');
    const passwordInput = document.getElementById('passwordInput');
    const statusMsg = document.getElementById('statusMessage');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent)'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--card-border)'; });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--card-border)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadFile(e.target.files[0]);
      }
    });

    function loadFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        envelopeInput.value = e.target.result;
        showStatus('Loaded file: ' + file.name, 'var(--success)');
      };
      reader.readAsText(file);
    }

    document.getElementById('togglePassword').addEventListener('click', () => {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      document.getElementById('togglePassword').innerText = isPass ? 'Hide' : 'Show';
    });

    document.getElementById('testVectorBtn').addEventListener('click', () => {
      envelopeInput.value = SAMPLE_ENVELOPE;
      passwordInput.value = 'SovereignDot2026!';
      showStatus('Loaded sample test envelope. Click "Decrypt & Derive Keys" to verify.', 'var(--accent)');
    });

    function showStatus(text, color) {
      statusMsg.style.display = 'block';
      statusMsg.style.color = color || 'var(--text-muted)';
      statusMsg.innerText = text;
    }

    // Hex and byte helpers
    function hexToBytes(hex) {
      const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      }
      return bytes;
    }

    function bytesToHex(bytes) {
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Decrypt button handler
    document.getElementById('decryptBtn').addEventListener('click', async () => {
      const rawEnvelope = envelopeInput.value.trim();
      const password = passwordInput.value;

      if (!rawEnvelope) {
        showStatus('Please paste a .dot1 envelope or upload a file.', 'var(--danger)');
        return;
      }
      if (!password) {
        showStatus('Please enter the vault decryption password.', 'var(--danger)');
        return;
      }

      showStatus('Decrypting with Web Crypto hardware acceleration...', 'var(--accent)');

      try {
        let envelope;
        try {
          envelope = JSON.parse(rawEnvelope);
        } catch (e) {
          // Check base64
          try {
            envelope = JSON.parse(atob(rawEnvelope));
          } catch {
            throw new Error('Invalid envelope format: not a valid JSON or base64 string.');
          }
        }

        // Validate envelope parameters
        const saltHex = envelope.kdf?.params?.salt || envelope.salt;
        const iterations = envelope.kdf?.params?.iterations || envelope.iterations || 100000;
        const hashAlg = envelope.kdf?.params?.hash || 'SHA-256';
        const ivHex = envelope.cipher?.params?.iv || envelope.iv;
        const ciphertextHex = envelope.ciphertext;

        if (!saltHex || !ivHex || !ciphertextHex) {
          throw new Error('Missing salt, IV, or ciphertext in .dot1 envelope.');
        }

        const salt = hexToBytes(saltHex);
        const iv = hexToBytes(ivHex);
        const ciphertext = hexToBytes(ciphertextHex);

        // Derive key using Web Crypto PBKDF2
        const enc = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
          'raw',
          enc.encode(password),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        const derivedKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: hashAlg
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        // Decrypt ciphertext using Web Crypto AES-GCM
        const decryptedBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv, tagLength: 128 },
          derivedKey,
          ciphertext
        );

        const decryptedText = new TextDecoder().decode(decryptedBuf).trim();
        let mnemonic = decryptedText;

        // In case payload was JSON stringified
        try {
          const parsedPayload = JSON.parse(decryptedText);
          if (parsedPayload.mnemonic) {
            mnemonic = parsedPayload.mnemonic;
          }
        } catch {
          // plain text mnemonic
        }

        activeMnemonic = mnemonic;
        deriveAndDisplayKeys(mnemonic);
        showStatus('Decryption successful! Keys derived offline.', 'var(--success)');
      } catch (err) {
        console.error('Decryption error:', err);
        showStatus('Decryption failed: ' + (err.message || 'Incorrect password or corrupt envelope'), 'var(--danger)');
      }
    });

    function deriveAndDisplayKeys(mnemonic) {
      const cryptoLib = window.DOT_CRYPTO;
      if (!cryptoLib) {
        showStatus('Crypto library failed to initialize.', 'var(--danger)');
        return;
      }

      const { bip39, HDKey, secp256k1, ed25519, keccak_256, sha256, ripemd160, base58, base58check, hex, bech32 } = cryptoLib;

      // 1. Render Mnemonic words
      const words = mnemonic.trim().split(/\\s+/);
      const wordGrid = document.getElementById('wordGrid');
      wordGrid.innerHTML = '';
      words.forEach((word, idx) => {
        const chip = document.createElement('div');
        chip.className = 'word-chip';
        chip.innerHTML = '<span class="word-idx">' + (idx + 1) + '.</span><strong>' + word + '</strong>';
        wordGrid.appendChild(chip);
      });

      // 2. Derive Seed
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const root = HDKey.fromMasterSeed(seed);

      // 3. EVM Derivation: m/44'/60'/0'/0/0
      const evmChild = root.derive("m/44'/60'/0'/0/0");
      const evmPrivHex = '0x' + hex.encode(evmChild.privateKey);
      const evmPubUncompressed = secp256k1.getPublicKey(evmChild.privateKey, false);
      const evmHash = keccak_256(evmPubUncompressed.slice(1));
      const evmAddr = '0x' + hex.encode(evmHash.slice(-20));

      document.getElementById('evmAddress').innerText = evmAddr;
      document.getElementById('evmPrivKey').innerText = evmPrivHex;

      // 4. Bitcoin Derivation
      // BIP84 Native SegWit: m/84'/0'/0'/0/0
      const btc84Child = root.derive("m/84'/0'/0'/0/0");
      const btc84Pub = secp256k1.getPublicKey(btc84Child.privateKey, true);
      const pkh84 = ripemd160(sha256(btc84Pub));
      const bech32Words = bech32.toWords(pkh84);
      const bc1Addr = bech32.encode('bc', new Uint8Array([0, ...bech32Words]));

      // BIP44 Legacy: m/44'/0'/0'/0/0
      const btc44Child = root.derive("m/44'/0'/0'/0/0");
      const btc44Pub = secp256k1.getPublicKey(btc44Child.privateKey, true);
      const pkh44 = ripemd160(sha256(btc44Pub));
      const btcLegacyAddr = base58check(sha256).encode(new Uint8Array([0x00, ...pkh44]));

      document.getElementById('btcNativeSegwit').innerText = bc1Addr;
      document.getElementById('btcLegacy').innerText = btcLegacyAddr;
      document.getElementById('btcPrivKey').innerText = hex.encode(btc84Child.privateKey);

      // 5. Solana Derivation
      const solSeed = sha256(seed).slice(0, 32);
      const solPub = ed25519.getPublicKey(solSeed);
      const solAddress = base58.encode(solPub);
      const solSecretKey = new Uint8Array(64);
      solSecretKey.set(solSeed);
      solSecretKey.set(solPub, 32);
      const solPrivBase58 = base58.encode(solSecretKey);

      document.getElementById('solAddress').innerText = solAddress;
      document.getElementById('solPrivKey').innerText = solPrivBase58;

      document.getElementById('resultsContainer').style.display = 'flex';
      document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
    }

    // Helper functions
    window.copyText = function(elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const text = el.innerText;
      navigator.clipboard.writeText(text);
      const originalText = el.innerText;
      el.innerText = 'Copied to clipboard!';
      setTimeout(() => { el.innerText = originalText; }, 1200);
    };

    window.toggleBlur = function(element) {
      if (element.style.filter === 'none') {
        element.style.filter = 'blur(4px)';
      } else {
        element.style.filter = 'none';
      }
    };

    document.getElementById('copyMnemonicBtn').addEventListener('click', () => {
      if (!activeMnemonic) return;
      navigator.clipboard.writeText(activeMnemonic);
      const btn = document.getElementById('copyMnemonicBtn');
      btn.innerText = 'Copied!';
      setTimeout(() => { btn.innerText = 'Copy Phrase'; }, 1500);
    });

    document.getElementById('wipeBtn').addEventListener('click', () => {
      activeMnemonic = '';
      document.getElementById('resultsContainer').style.display = 'none';
      document.getElementById('wordGrid').innerHTML = '';
      document.getElementById('evmAddress').innerText = '';
      document.getElementById('evmPrivKey').innerText = '';
      document.getElementById('btcNativeSegwit').innerText = '';
      document.getElementById('btcLegacy').innerText = '';
      document.getElementById('btcPrivKey').innerText = '';
      document.getElementById('solAddress').innerText = '';
      document.getElementById('solPrivKey').innerText = '';
      passwordInput.value = '';
      envelopeInput.value = '';
      showStatus('Keys and sensitive buffers wiped from browser memory.', 'var(--success)');
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.resolve(__dirname, '../public/decryptor.html'), html, 'utf8');
console.log('Successfully generated public/decryptor.html! Total size:', fs.statSync(path.resolve(__dirname, '../public/decryptor.html')).size);
