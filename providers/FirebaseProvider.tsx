'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useSession } from '@/providers/SessionProvider';

interface FirebaseCtx {
  firebaseUid: string | null;
  stableUid: string | null;
  classId: string | null;
  ready: boolean;
}

const Ctx = createContext<FirebaseCtx>({
  firebaseUid: null,
  stableUid: null,
  classId: null,
  ready: false,
});

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [stableUid, setStableUid] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const init = useCallback(async (username: string, klasseId: number, klasseName: string) => {
    try {
      // 1. Ensure Firebase anonymous session
      let fbUid = auth.currentUser?.uid ?? null;
      if (!fbUid) {
        const cred = await signInAnonymously(auth);
        fbUid = cred.user.uid;
      }
      setFirebaseUid(fbUid);

      // 2. Resolve stableUid from Firestore users/{username}
      const usernameRef = doc(db, 'users', username);
      const usernameSnap = await getDoc(usernameRef);
      let stable: string;

      if (usernameSnap.exists()) {
        const existing = usernameSnap.data()?.stableUid as string | undefined;
        if (existing) {
          stable = existing;
          await updateDoc(usernameRef, {
            updatedAt: serverTimestamp(),
            webuntisKlasseId: klasseId,
            webuntisKlasseName: klasseName,
          });
        } else {
          stable = generateId();
          await updateDoc(usernameRef, { stableUid: stable });
        }
      } else {
        stable = generateId();
        await setDoc(usernameRef, {
          username,
          stableUid: stable,
          createdAt: serverTimestamp(),
          webuntisKlasseId: klasseId,
          webuntisKlasseName: klasseName,
        });
      }

      // Also write device-specific doc for admin checks
      await setDoc(doc(db, 'users', fbUid), {
        username,
        stableUid: stable,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setStableUid(stable);

      // 3. Auto-join/create WebUntis class
      // Already in correct class?
      const alreadySnap = await getDocs(
        query(
          collection(db, 'classes'),
          where('members', 'array-contains', stable),
          where('webuntisKlasseId', '==', klasseId)
        )
      );

      if (!alreadySnap.empty) {
        setClassId(alreadySnap.docs[0].id);
        setReady(true);
        return;
      }

      // Wrong class? Leave it.
      const wrongSnap = await getDocs(
        query(collection(db, 'classes'), where('members', 'array-contains', stable))
      );
      for (const wrongDoc of wrongSnap.docs) {
        const d = wrongDoc.data();
        if (d.webuntisKlasseId != null && d.webuntisKlasseId !== klasseId) {
          const newMembers = (d.members as string[]).filter((m) => m !== stable);
          if (newMembers.length === 0) {
            // Delete empty class
            await setDoc(wrongDoc.ref, { members: [] }, { merge: true });
          } else {
            await updateDoc(wrongDoc.ref, {
              members: newMembers.filter((m: string) => m !== stable),
              [`memberNames.${stable}`]: deleteField(),
            });
          }
        }
      }

      // Find target class
      const targetSnap = await getDocs(
        query(collection(db, 'classes'), where('webuntisKlasseId', '==', klasseId))
      );

      if (!targetSnap.empty) {
        const targetRef = targetSnap.docs[0].ref;
        await updateDoc(targetRef, {
          members: arrayUnion(stable),
          [`memberNames.${stable}`]: username,
        });
        setClassId(targetSnap.docs[0].id);
      } else {
        // Create new class
        const newRef = doc(collection(db, 'classes'));
        await setDoc(newRef, {
          name: klasseName,
          code: generateCode(),
          members: [stable],
          memberNames: { [stable]: username },
          createdBy: stable,
          createdByName: username,
          webuntisKlasseId: klasseId,
          createdAt: serverTimestamp(),
        });
        setClassId(newRef.id);
      }

      setReady(true);
    } catch (e) {
      console.error('[FirebaseProvider] init error:', e);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Restore existing Firebase session if present
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) setFirebaseUid(fbUser.uid);
    });
    init(user.username, user.klasseId, user.klasseName);
    return () => unsub();
  }, [user, init]);

  return (
    <Ctx.Provider value={{ firebaseUid, stableUid, classId, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export const useFirebase = () => useContext(Ctx);
