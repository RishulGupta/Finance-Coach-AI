// firebase.ts - POPUP VERSION
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCO-drPIrpYcgODvv2Hz4D_8oTCTLYOyXw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "myfinancecoach-63634.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "myfinancecoach-63634",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "myfinancecoach-63634.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "632529156740",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:632529156740:web:7b0f205aabcae6223de0d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Initiates Google Sign-In via a standard Popup window.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error with Google Popup:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};