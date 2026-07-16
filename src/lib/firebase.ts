import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "numeric-tributary-2lkqp",
  appId: "1:717497854029:web:b61e50f47a8a83f5e09404",
  apiKey: "AIzaSyDz8z3FRid0tD6r4BqzGMIuJeG8avyMi5Y",
  authDomain: "numeric-tributary-2lkqp.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-ocraccounting-be84e89c-9e78-4312-bd25-809155c578d2",
  storageBucket: "numeric-tributary-2lkqp.firebasestorage.app",
  messagingSenderId: "717497854029",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Custom connection validation
export async function testFirebaseConnection() {
  try {
    // Attempt to read a test document from the custom database ID
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Connection verified successfully.");
    return true;
  } catch (error: any) {
    console.warn("Firebase test connection warning (this is normal if no database collection is setup yet):", error.message);
    if (error?.message && error.message.includes("the client is offline")) {
      console.error("Firebase is offline. Please check your network and configuration.");
    }
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

