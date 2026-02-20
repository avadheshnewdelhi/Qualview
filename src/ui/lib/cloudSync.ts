import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PersistedState } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CloudProject {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    figmaFileKey?: string;
}

// ─── Save ───────────────────────────────────────────────────────────────────

export async function saveToCloud(
    uid: string,
    projectId: string,
    projectName: string,
    state: PersistedState,
    figmaFileKey?: string
): Promise<void> {
    const ref = doc(db, 'users', uid, 'projects', projectId);
    await setDoc(ref, {
        name: projectName,
        figmaFileKey: figmaFileKey || null,
        context: state.context,
        researchObjects: state.researchObjects,
        transcripts: state.transcripts,
        currentStep: state.currentStep,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(), // Only set on first write; merge keeps existing
    }, { merge: true });
}

// ─── Load ───────────────────────────────────────────────────────────────────

export async function loadFromCloud(
    uid: string,
    projectId: string
): Promise<PersistedState | null> {
    const ref = doc(db, 'users', uid, 'projects', projectId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
        version: 1,
        context: data.context || {},
        researchObjects: data.researchObjects || [],
        transcripts: data.transcripts || [],
        currentStep: data.currentStep || 0,
        lastSaved: data.updatedAt?.toMillis?.() || Date.now(),
    };
}

// ─── List ───────────────────────────────────────────────────────────────────

export async function listProjects(uid: string): Promise<CloudProject[]> {
    const ref = collection(db, 'users', uid, 'projects');
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            name: data.name || 'Untitled',
            createdAt: data.createdAt?.toMillis?.() || 0,
            updatedAt: data.updatedAt?.toMillis?.() || 0,
            figmaFileKey: data.figmaFileKey || undefined,
        };
    });
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteProject(uid: string, projectId: string): Promise<void> {
    const ref = doc(db, 'users', uid, 'projects', projectId);
    await deleteDoc(ref);
}
