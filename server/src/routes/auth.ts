import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { nanoid } from 'nanoid';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { 
  signAccessToken, 
  signRefreshToken, 
  signMagicLinkToken, 
  verifyToken 
} from '../auth/jwt.js';
import type { MagicLinkPayload } from '../auth/jwt.js';
import { toUserResponse } from '../utils/toUserResponse.js';
import { sendEmail } from '../services/emailService.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/magic-link', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Valid email is required (max 254 chars)' });
    }

    const token = signMagicLinkToken(email);
    const verifyUrl = `${config.clientUrl}/auth/verify?token=${token}`;

    try {
      await sendEmail({
        to: email,
        subject: 'Sign in to Watchly',
        html: `<p>Click the link below to sign in:</p><p><a href="${verifyUrl}">Sign in to Watchly</a></p><p>This link expires in 15 minutes.</p>`,
        context: 'Magic Link',
      });
    } catch (sendErr: any) {
      console.warn(`[Auth] Failed to send email to ${email}.`);
      console.warn(`[Auth] MAGIC LINK: ${verifyUrl}`);
      throw sendErr;
    }

    res.json({ message: 'Magic link sent' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'Magic link logged to console (Dev Mode)' });
    }
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const payload = verifyToken<MagicLinkPayload>(token);
    if (!payload || payload.type !== 'magic_link') {
      return res.status(400).json({ error: 'Invalid or expired magic link' });
    }

    const { user, isNew } = await findOrCreateUser(payload.email);
    
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.json({ accessToken, refreshToken, user: toUserResponse(user), isNew });
  } catch (err) {
    next(err);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { user, isNew } = await findOrCreateUser(payload.email, payload.name, payload.picture);

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.json({ accessToken, refreshToken, user: toUserResponse(user), isNew });
  } catch (err) {
    next(err);
  }
});

async function findOrCreateUser(email: string, name?: string, avatarUrl?: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (res.rows.length > 0) {
      await client.query('COMMIT');
      return { user: res.rows[0], isNew: false };
    }

    const id = nanoid(10);
    const displayName = name || email.split('@')[0];

    const insertRes = await client.query(
      'INSERT INTO users (id, email, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, email, displayName, avatarUrl || null]
    );

    await client.query('COMMIT');
    return { user: insertRes.rows[0], isNew: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default router;
