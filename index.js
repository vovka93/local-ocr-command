import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tif', '.tiff']);

function getPluginConfig(api) {
  const cfg = api?.config?.plugins?.entries?.['local-ocr-command']?.config || {};
  return {
    inboundDir: cfg.inboundDir || '/home/vova/.openclaw/media/inbound',
    ocrCliPath: cfg.ocrCliPath || '/home/vova/.openclaw/workspace/mcp/tesseract-ocr/src/cli.js',
    defaultLang: cfg.defaultLang || 'eng+ukr',
    maxAgeMinutes: Number.isFinite(cfg.maxAgeMinutes) ? cfg.maxAgeMinutes : 10
  };
}

async function findLatestInboundImage(inboundDir, maxAgeMs) {
  const now = Date.now();
  const entries = await fs.readdir(inboundDir, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const full = path.join(inboundDir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    const stat = await fs.stat(full).catch(() => null);
    if (!stat) continue;
    if (now - stat.mtimeMs > maxAgeMs) continue;
    candidates.push({ full, mtimeMs: stat.mtimeMs });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0]?.full || null;
}

async function runOcr(ocrCliPath, imagePath, lang) {
  const { stdout, stderr } = await execFileAsync('node', [ocrCliPath, imagePath, lang], {
    maxBuffer: 20 * 1024 * 1024,
    cwd: process.cwd()
  });
  return { text: stdout.trim(), stderr: stderr.trim() };
}

export default function register(api) {
  api.registerCommand({
    name: 'ocr',
    description: 'Read text from the latest attached image locally via Tesseract OCR (no OpenAI vision).',
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx) => {
      const pluginCfg = getPluginConfig(api);
      const raw = (ctx.args || '').trim();
      const langMatch = raw.match(/(?:^|\s)--lang=(\S+)/i);
      const lang = langMatch?.[1] || pluginCfg.defaultLang;
      const explicitPath = raw.replace(/(?:^|\s)--lang=\S+/ig, '').trim();
      const imagePath = explicitPath || await findLatestInboundImage(pluginCfg.inboundDir, pluginCfg.maxAgeMinutes * 60_000);
      if (!imagePath) {
        return { text: 'Не бачу свіжого зображення для OCR. Надішли фото і потім окремо `/ocr`, або дай шлях: `/ocr /path/to/file.jpg`.' };
      }
      try {
        const result = await runOcr(pluginCfg.ocrCliPath, imagePath, lang);
        const text = result.text || '(нічого не розпізнано)';
        return { text: `OCR (${lang})\nФайл: ${imagePath}\n\n${text}` };
      } catch (err) {
        const message = err?.stderr || err?.message || String(err);
        api.logger?.error?.(`local-ocr-command failed: ${message}`);
        return { text: `OCR помилка для ${imagePath}\n${message}` };
      }
    }
  });
}
