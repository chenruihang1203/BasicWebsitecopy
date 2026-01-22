#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const i = trimmed.indexOf('=');
      if (i === -1) continue;
      const k = trimmed.slice(0, i).trim();
      const v = trimmed.slice(i + 1).trim();
      env[k] = v;
    }
    return env;
  } catch (e) {
    return {};
  }
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const envFile = path.join(repoRoot, '.env.local');
  const env = loadEnvFile(envFile);

  const key = process.env.QWEN_API_KEY || env.QWEN_API_KEY;
  const base = process.env.QWEN_BASE_URL || env.QWEN_BASE_URL;

  if (!key || !base) {
    console.error('Missing QWEN configuration. Please ensure QWEN_API_KEY and QWEN_BASE_URL are set in .env.local or exported in your shell.');
    process.exit(2);
  }

  const endpoint = base.replace(/\/$/, '') + '/chat/completions';

  console.log('Testing QWEN endpoint:', endpoint);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      // Use chat-style messages (role + content) — DashScope compatible mode expects this
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'user', content: 'Hello from test — please respond with a short confirmation.' },
        ],
      }),
      // short timeout
      signal: (() => { const ac = new AbortController(); setTimeout(() => ac.abort(), 15000); return ac.signal })(),
    });

    console.log('HTTP status:', res.status);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      console.log('Response (truncated):', JSON.stringify(j, null, 2).slice(0, 2000));
    } else {
      const t = await res.text();
      console.log('Response text (truncated):', t.slice(0, 2000));
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Request timed out (15s)');
      process.exit(3);
    }
    console.error('Request error:', err.message || err);
    process.exit(4);
  }
})();
