import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocFromServer } from "firebase/firestore";

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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Custom connection validation
export async function testFirebaseConnection() {
  try {
    // Attempt to test server reachability using getDocFromServer
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Connection verified successfully.");
    return true;
  } catch (error: any) {
    if (error?.code === "unavailable" || error?.message?.includes("offline") || error?.message?.includes("Could not reach")) {
      console.warn("Firestore operates in offline/cached mode until connection is re-established.");
    } else {
      console.warn("Firebase test connection info:", error?.message || error);
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
  const errMessage = error instanceof Error ? error.message : String(error);
  const isUnavailable = 
    errMessage.includes("unavailable") || 
    errMessage.includes("offline") || 
    errMessage.includes("Could not reach Cloud Firestore") ||
    (error as any)?.code === "unavailable";

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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

  if (isUnavailable) {
    console.warn("Firestore Connection Warning (Offline/Unavailable):", JSON.stringify(errInfo));
    return;
  }

  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

