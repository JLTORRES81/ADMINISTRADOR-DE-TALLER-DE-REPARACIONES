import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  setDoc,
  doc,
  getDocs,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Ticket, Technician, PriceCategoryItem, InvoiceRecord } from './types';
import {
  INITIAL_TICKETS,
  INITIAL_TECHNICIANS,
  INITIAL_PRICE_CATEGORIES,
  INITIAL_INVOICES,
} from './data/mockData';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: The app must configure databaseId as per Firebase Integration Skill
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.warn('Google Sign-in popup cancelled or error:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Error signing out:', error);
  }
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation as required by Skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is in offline mode or database is provisioning.');
    }
    return false;
  }
}

// --- Sync Service Layer with Local Storage Resilience ---

const TICKETS_KEY = 'electrofix_tickets';
const TECHS_KEY = 'electrofix_technicians';
const PRICES_KEY = 'electrofix_prices';
const INVOICES_KEY = 'electrofix_invoices';

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function persistStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Subscribe to Tickets
export function syncTickets(
  onUpdate: (tickets: Ticket[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collectionPath = 'tickets';
  try {
    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Ticket[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Ticket);
          });
          persistStoredData(TICKETS_KEY, list);
          onUpdate(list);
        } else {
          // If empty in remote, serve cached or initial
          const cached = loadStoredData<Ticket[]>(TICKETS_KEY, INITIAL_TICKETS);
          onUpdate(cached);
        }
      },
      (error) => {
        console.warn('Firestore tickets sync falling back to local storage:', error.message);
        const cached = loadStoredData<Ticket[]>(TICKETS_KEY, INITIAL_TICKETS);
        onUpdate(cached);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore onSnapshot init error, using local state.');
    const cached = loadStoredData<Ticket[]>(TICKETS_KEY, INITIAL_TICKETS);
    onUpdate(cached);
    return () => {};
  }
}

export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  const docPath = `tickets/${ticket.id}`;
  try {
    await setDoc(doc(db, 'tickets', ticket.id), ticket);
  } catch (error) {
    console.warn(`Could not sync ticket ${ticket.id} to Firestore immediately:`, error);
  }
}

// Subscribe to Technicians
export function syncTechnicians(
  onUpdate: (techs: Technician[]) => void
): () => void {
  const collectionPath = 'technicians';
  try {
    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Technician[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Technician);
          });
          persistStoredData(TECHS_KEY, list);
          onUpdate(list);
        } else {
          const cached = loadStoredData<Technician[]>(TECHS_KEY, INITIAL_TECHNICIANS);
          onUpdate(cached);
        }
      },
      (error) => {
        console.warn('Firestore technicians sync falling back to local storage:', error.message);
        const cached = loadStoredData<Technician[]>(TECHS_KEY, INITIAL_TECHNICIANS);
        onUpdate(cached);
      }
    );
    return unsubscribe;
  } catch {
    const cached = loadStoredData<Technician[]>(TECHS_KEY, INITIAL_TECHNICIANS);
    onUpdate(cached);
    return () => {};
  }
}

export async function saveTechnicianToFirestore(tech: Technician): Promise<void> {
  try {
    await setDoc(doc(db, 'technicians', tech.id), tech);
  } catch (error) {
    console.warn(`Could not sync tech ${tech.id} to Firestore immediately:`, error);
  }
}

// Subscribe to Price Categories
export function syncPriceCategories(
  onUpdate: (cats: PriceCategoryItem[]) => void
): () => void {
  const collectionPath = 'priceCategories';
  try {
    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PriceCategoryItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as PriceCategoryItem);
          });
          persistStoredData(PRICES_KEY, list);
          onUpdate(list);
        } else {
          const cached = loadStoredData<PriceCategoryItem[]>(PRICES_KEY, INITIAL_PRICE_CATEGORIES);
          onUpdate(cached);
        }
      },
      (error) => {
        console.warn('Firestore prices sync falling back to local storage:', error.message);
        const cached = loadStoredData<PriceCategoryItem[]>(PRICES_KEY, INITIAL_PRICE_CATEGORIES);
        onUpdate(cached);
      }
    );
    return unsubscribe;
  } catch {
    const cached = loadStoredData<PriceCategoryItem[]>(PRICES_KEY, INITIAL_PRICE_CATEGORIES);
    onUpdate(cached);
    return () => {};
  }
}

export async function savePriceCategoryToFirestore(cat: PriceCategoryItem): Promise<void> {
  try {
    await setDoc(doc(db, 'priceCategories', cat.id), cat);
  } catch (error) {
    console.warn(`Could not sync price category ${cat.id} to Firestore immediately:`, error);
  }
}

// Subscribe to Invoices
export function syncInvoices(
  onUpdate: (invs: InvoiceRecord[]) => void
): () => void {
  const collectionPath = 'invoices';
  try {
    const unsubscribe = onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: InvoiceRecord[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as InvoiceRecord);
          });
          persistStoredData(INVOICES_KEY, list);
          onUpdate(list);
        } else {
          const cached = loadStoredData<InvoiceRecord[]>(INVOICES_KEY, INITIAL_INVOICES);
          onUpdate(cached);
        }
      },
      (error) => {
        console.warn('Firestore invoices sync falling back to local storage:', error.message);
        const cached = loadStoredData<InvoiceRecord[]>(INVOICES_KEY, INITIAL_INVOICES);
        onUpdate(cached);
      }
    );
    return unsubscribe;
  } catch {
    const cached = loadStoredData<InvoiceRecord[]>(INVOICES_KEY, INITIAL_INVOICES);
    onUpdate(cached);
    return () => {};
  }
}

export async function saveInvoiceToFirestore(inv: InvoiceRecord): Promise<void> {
  try {
    await setDoc(doc(db, 'invoices', inv.id), inv);
  } catch (error) {
    console.warn(`Could not sync invoice ${inv.id} to Firestore immediately:`, error);
  }
}

// --- Firestore Contingency Backup & Manual JSON Export Service ---

export interface FirestoreBackupPackage {
  metadata: {
    app: string;
    version: string;
    exportedAt: string;
    environment: string;
    databaseId: string;
    totalDocuments: number;
    collectionCounts: {
      tickets: number;
      technicians: number;
      priceCategories: number;
      invoices: number;
      workbenchNotifications: number;
    };
  };
  collections: {
    tickets: Ticket[];
    technicians: Technician[];
    priceCategories: PriceCategoryItem[];
    invoices: InvoiceRecord[];
    workbenchNotifications: unknown[];
  };
}

export async function exportFirestoreDatabaseBackup(): Promise<FirestoreBackupPackage> {
  const backup: FirestoreBackupPackage = {
    metadata: {
      app: 'ElectroFix OS - Electronics del Sureste',
      version: '2.4.0-tallerpro',
      exportedAt: new Date().toISOString(),
      environment: 'Producción / Taller Sede Principal',
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      totalDocuments: 0,
      collectionCounts: {
        tickets: 0,
        technicians: 0,
        priceCategories: 0,
        invoices: 0,
        workbenchNotifications: 0,
      },
    },
    collections: {
      tickets: [],
      technicians: [],
      priceCategories: [],
      invoices: [],
      workbenchNotifications: [],
    },
  };

  // 1. Fetch Tickets
  try {
    const snap = await getDocs(collection(db, 'tickets'));
    if (!snap.empty) {
      snap.forEach((d) => backup.collections.tickets.push(d.data() as Ticket));
    } else {
      backup.collections.tickets = loadStoredData<Ticket[]>(TICKETS_KEY, INITIAL_TICKETS);
    }
  } catch {
    backup.collections.tickets = loadStoredData<Ticket[]>(TICKETS_KEY, INITIAL_TICKETS);
  }

  // 2. Fetch Technicians
  try {
    const snap = await getDocs(collection(db, 'technicians'));
    if (!snap.empty) {
      snap.forEach((d) => backup.collections.technicians.push(d.data() as Technician));
    } else {
      backup.collections.technicians = loadStoredData<Technician[]>(TECHS_KEY, INITIAL_TECHNICIANS);
    }
  } catch {
    backup.collections.technicians = loadStoredData<Technician[]>(TECHS_KEY, INITIAL_TECHNICIANS);
  }

  // 3. Fetch Price Categories
  try {
    const snap = await getDocs(collection(db, 'priceCategories'));
    if (!snap.empty) {
      snap.forEach((d) => backup.collections.priceCategories.push(d.data() as PriceCategoryItem));
    } else {
      backup.collections.priceCategories = loadStoredData<PriceCategoryItem[]>(PRICES_KEY, INITIAL_PRICE_CATEGORIES);
    }
  } catch {
    backup.collections.priceCategories = loadStoredData<PriceCategoryItem[]>(PRICES_KEY, INITIAL_PRICE_CATEGORIES);
  }

  // 4. Fetch Invoices
  try {
    const snap = await getDocs(collection(db, 'invoices'));
    if (!snap.empty) {
      snap.forEach((d) => backup.collections.invoices.push(d.data() as InvoiceRecord));
    } else {
      backup.collections.invoices = loadStoredData<InvoiceRecord[]>(INVOICES_KEY, INITIAL_INVOICES);
    }
  } catch {
    backup.collections.invoices = loadStoredData<InvoiceRecord[]>(INVOICES_KEY, INITIAL_INVOICES);
  }

  // 5. Fetch Workbench Notifications
  try {
    const snap = await getDocs(collection(db, 'workbenchNotifications'));
    if (!snap.empty) {
      snap.forEach((d) => backup.collections.workbenchNotifications.push(d.data()));
    } else {
      const raw = localStorage.getItem('electrofix_workbench_notifications');
      backup.collections.workbenchNotifications = raw ? JSON.parse(raw) : [];
    }
  } catch {
    const raw = localStorage.getItem('electrofix_workbench_notifications');
    backup.collections.workbenchNotifications = raw ? JSON.parse(raw) : [];
  }

  // Compute final counts
  backup.metadata.collectionCounts = {
    tickets: backup.collections.tickets.length,
    technicians: backup.collections.technicians.length,
    priceCategories: backup.collections.priceCategories.length,
    invoices: backup.collections.invoices.length,
    workbenchNotifications: backup.collections.workbenchNotifications.length,
  };

  backup.metadata.totalDocuments =
    backup.metadata.collectionCounts.tickets +
    backup.metadata.collectionCounts.technicians +
    backup.metadata.collectionCounts.priceCategories +
    backup.metadata.collectionCounts.invoices +
    backup.metadata.collectionCounts.workbenchNotifications;

  return backup;
}

export function downloadBackupJsonFile(backup: FirestoreBackupPackage): void {
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `ElectroFix_Firestore_Backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function restoreFirestoreFromBackup(
  backup: FirestoreBackupPackage
): Promise<{ restoredCount: number }> {
  let count = 0;

  // Restore tickets
  if (Array.isArray(backup.collections.tickets)) {
    for (const ticket of backup.collections.tickets) {
      await saveTicketToFirestore(ticket);
      count++;
    }
    persistStoredData(TICKETS_KEY, backup.collections.tickets);
  }

  // Restore technicians
  if (Array.isArray(backup.collections.technicians)) {
    for (const tech of backup.collections.technicians) {
      await saveTechnicianToFirestore(tech);
      count++;
    }
    persistStoredData(TECHS_KEY, backup.collections.technicians);
  }

  // Restore prices
  if (Array.isArray(backup.collections.priceCategories)) {
    for (const price of backup.collections.priceCategories) {
      await savePriceCategoryToFirestore(price);
      count++;
    }
    persistStoredData(PRICES_KEY, backup.collections.priceCategories);
  }

  // Restore invoices
  if (Array.isArray(backup.collections.invoices)) {
    for (const inv of backup.collections.invoices) {
      await saveInvoiceToFirestore(inv);
      count++;
    }
    persistStoredData(INVOICES_KEY, backup.collections.invoices);
  }

  return { restoredCount: count };
}

