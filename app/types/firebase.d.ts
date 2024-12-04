import { Firestore, DocumentData, QueryConstraint, CollectionReference, DocumentReference, Query, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseApp, FirebaseOptions } from 'firebase/app';

declare module 'firebase/app' {
  export function initializeApp(config: FirebaseOptions): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(): FirebaseApp;
}

declare module 'firebase/firestore' {
  export function getFirestore(app: FirebaseApp): Firestore;
  export function collection(firestore: Firestore, path: string): CollectionReference<DocumentData>;
  export function addDoc(reference: CollectionReference<DocumentData>, data: DocumentData): Promise<DocumentReference>;
  export function serverTimestamp(): FieldValue;
  export function query(collection: CollectionReference<DocumentData>, ...queryConstraints: QueryConstraint[]): Query<DocumentData>;
  export function getDocs(query: Query<DocumentData>): Promise<QuerySnapshot<DocumentData>>;
  export function getDoc(reference: DocumentReference): Promise<DocumentSnapshot<DocumentData>>;
  export function setDoc(
    reference: DocumentReference,
    data: DocumentData,
    options?: { merge?: boolean }
  ): Promise<void>;
  export function updateDoc(reference: DocumentReference, data: Partial<DocumentData>): Promise<void>;
  export function doc(firestore: Firestore, collection: string, id: string): DocumentReference;
  export function where(field: string, opStr: string, value: unknown): QueryConstraint;
  export function orderBy(field: string, direction?: 'asc' | 'desc'): QueryConstraint;
  export function enableIndexedDbPersistence(firestore: Firestore): Promise<void>;
  
  export interface FieldValue {
    isEqual(other: FieldValue): boolean;
  }
}

declare module 'firebase/auth' {
  export function getAuth(app: FirebaseApp): Auth;
}
