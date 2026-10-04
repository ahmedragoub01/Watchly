import { Router, type Request, type Response } from 'express';
import { Readable } from 'stream';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export const proxyRouter = Router();

const DRIVE_ID_RE = /^[a-zA-Z0-9_-]{10,128}$/;

proxyRouter.get('/drive/:id', async (req: Request, res: Response) => {
  const videoId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!videoId || !DRIVE_ID_RE.test(videoId)) {
    res.status(400).json({ error: 'Invalid video id' });
    return;
  }
  let url = `https://drive.google.com/uc?export=download&id=${videoId}`;

  try {
    const initialHeaders: Record<string, string> = {};
    const rawRange = req.headers.range;
    if (rawRange) initialHeaders.Range = Array.isArray(rawRange) ? rawRange[0] : rawRange;

    let driveRes = await fetch(url, { headers: initialHeaders, redirect: 'follow' });

    if (!driveRes.ok) {
      res.status(driveRes.status >= 500 ? 502 : driveRes.status).json({
        error: config.isDev ? 'Upstream fetch failed' : 'Unable to fetch video'
      });
      return;
    }

    const contentType = driveRes.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const html = await driveRes.text();
      const actionMatch = html.match(/action="([^"]+)"/);
      const confirmMatch = html.match(/name="confirm" value="([^"]+)"/);
      const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);

      if (actionMatch && confirmMatch) {
        url = `${actionMatch[1]}?id=${videoId}&export=download&confirm=${confirmMatch[1]}`;
        if (uuidMatch) {
          url += `&uuid=${uuidMatch[1]}`;
        }

        const cookieHeader = driveRes.headers.get('set-cookie');
        const headers: Record<string, string> = {};
        if (cookieHeader) headers['Cookie'] = cookieHeader;
        const rRange = req.headers.range;
        if (rRange) headers.Range = Array.isArray(rRange) ? rRange[0] : rRange;

        driveRes = await fetch(url, { headers, redirect: 'follow' });
      } else {
        logger.warn('Drive proxy: virus scan page without confirm tokens');
        res.status(502).json({ error: 'Unable to fetch video' });
        return;
      }
    }

    driveRes.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'content-security-policy', 'connection', 'keep-alive'].includes(lowerKey)) {
        return;
      }
      res.setHeader(key, value);
    });

    res.status(driveRes.status);

    if (driveRes.body) {
      const readable = Readable.fromWeb(driveRes.body as any);
      readable.pipe(res);
      req.on('close', () => { readable.destroy(); });
    } else {
      res.end();
    }
  } catch (err) {
    logger.error('Drive proxy error', { error: (err as Error).message });
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
});
