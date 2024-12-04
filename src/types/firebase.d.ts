import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';

declare module 'firebase/app' {
  export function initializeApp(config: any): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(): FirebaseApp;
}

declare module 'firebase/firestore' {
  export function getFirestore(app: FirebaseApp): Firestore;
  export function collection(firestore: Firestore, path: string): any;
  export function addDoc(reference: any, data: any): Promise<any>;
  export function serverTimestamp(): any;
  export function query(collection: any, ...queryConstraints: any[]): any;
  export function getDocs(query: any): Promise<{
    docs: Array<{
      id: string;
      data(): any;
    }>;
  }>;
  export function getDoc(reference: any): Promise<{
    exists(): boolean;
    data(): any;
  }>;
  export function setDoc(
    reference: any,
    data: any,
    options?: { merge?: boolean }
  ): Promise<void>;
  export function updateDoc(reference: any, data: any): Promise<void>;
  export function doc(firestore: Firestore, collection: string, id: string): any;
  export function where(field: string, opStr: string, value: any): any;
  export function orderBy(field: string, direction?: 'asc' | 'desc'): any;
  export function enableIndexedDbPersistence(firestore: Firestore): Promise<void>;
}

declare module 'firebase/auth' {
  export function getAuth(app: FirebaseApp): Auth;
}
