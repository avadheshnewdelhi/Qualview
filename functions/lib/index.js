"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.exchangeAuthCode = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
admin.initializeApp();
// Secret stored in Google Cloud Secret Manager
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
// ─── Auth middleware ────────────────────────────────────────────────────────
async function verifyAuth(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
}
// ─── External Auth Flow for Figma Plugin ──────────────────────────────────────
const https_2 = require("firebase-functions/v2/https");
exports.exchangeAuthCode = (0, https_2.onCall)({
    cors: true,
    memory: '256MiB',
}, async (request) => {
    // The user must be authenticated in the web popup
    if (!request.auth) {
        throw new https_2.HttpsError('unauthenticated', 'User must sign in first.');
    }
    const sessionId = request.data.sessionId;
    if (!sessionId || typeof sessionId !== 'string') {
        throw new https_2.HttpsError('invalid-argument', 'Missing sessionId parameter.');
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
    }
    catch (error) {
        console.error('Failed to exchange auth token:', error);
        throw new https_2.HttpsError('internal', 'Internal error generating token.');
    }
});
// ─── /generate endpoint ────────────────────────────────────────────────────
exports.generate = (0, https_1.onRequest)({
    cors: true,
    secrets: [openaiApiKey],
    timeoutSeconds: 120,
    memory: '256MiB',
}, async (req, res) => {
    // Only POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    // Verify auth
    let uid;
    try {
        uid = await verifyAuth(req);
    }
    catch (err) {
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
        const client = new openai_1.default({ apiKey: openaiApiKey.value() });
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
    }
    catch (err) {
        console.error('OpenAI error:', err);
        res.status(500).json({
            error: 'AI generation failed',
            message: err instanceof Error ? err.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=index.js.map