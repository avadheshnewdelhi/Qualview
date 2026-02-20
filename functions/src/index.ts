import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

// Secret stored in Google Cloud Secret Manager
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// ─── Auth middleware ────────────────────────────────────────────────────────

async function verifyAuth(req: any): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
}

// ─── External Auth Flow for Figma Plugin ──────────────────────────────────────

import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const exchangeAuthCode = onCall(
    {
        cors: true,
        memory: '256MiB',
    },
    async (request) => {
        // The user must be authenticated in the web popup
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must sign in first.');
        }

        const sessionId = request.data.sessionId;
        if (!sessionId || typeof sessionId !== 'string') {
            throw new HttpsError('invalid-argument', 'Missing sessionId parameter.');
        }

        try {
            const uid = request.auth.uid;

            // Generate a Custom Token for the Figma Plugin client to use
            const customToken = await admin.auth().createCustomToken(uid);

            // Write the token to Firestore so the plugin can observe and retrieve it
            await admin.firestore().collection('auth_sessions').doc(sessionId).set({
                customToken,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                uid,
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to exchange auth token:', error);
            throw new HttpsError('internal', 'Internal error generating token.');
        }
    }
);

// ─── /generate endpoint ────────────────────────────────────────────────────

export const generate = onRequest(
    {
        cors: true,
        secrets: [openaiApiKey],
        timeoutSeconds: 120,
        memory: '256MiB',
    },
    async (req, res) => {
        // Only POST
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        // Verify auth
        let uid: string;
        try {
            uid = await verifyAuth(req);
        } catch (err) {
            res.status(401).json({
                error: 'Unauthorized',
                message: err instanceof Error ? err.message : 'Auth failed',
            });
            return;
        }

        // Parse request
        const { messages, model, responseFormat } = req.body;
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: 'messages array is required' });
            return;
        }

        try {
            const client = new OpenAI({ apiKey: openaiApiKey.value() });

            const completion = await client.chat.completions.create({
                model: model || 'gpt-4o',
                messages,
                temperature: 0.7,
                ...(responseFormat ? { response_format: responseFormat } : {}),
            });

            res.status(200).json({
                content: completion.choices[0]?.message?.content || '',
                usage: completion.usage,
                uid, // for audit
            });
        } catch (err) {
            console.error('OpenAI error:', err);
            res.status(500).json({
                error: 'AI generation failed',
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }
);
