'use client';

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  writeBatch,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/app/config/firebase';
import {
  TaskActivity,
  TaskActivityType,
  TaskAttachment,
  TaskComment,
  TaskFilters,
  TaskFormValues,
  TaskRecord,
  TaskStatus,
  TaskUserProfile,
} from '@/app/types/task-system';
import { filterVisibleTasks, isTaskAdmin, mapToTicketRole } from '@/app/utils/task-system-permissions';

const TASKS_COLLECTION = 'tasks';
const TASK_COMMENTS_COLLECTION = 'task_comments';
const TASK_ACTIVITIES_COLLECTION = 'task_activities';
const USERS_COLLECTION = 'users';
const TASK_META_COLLECTION = 'task_meta';
const COUNTERS_DOC_ID = 'counters';

type FirestoreDate = Timestamp | Date | string | number | null | undefined;
type FirestoreRecord = Record<string, unknown>;

interface TaskDocument extends FirestoreRecord {
  code?: string;
  title?: string;
  description?: string;
  createdBy?: string;
  assigneeIds?: string[];
  watcherIds?: string[];
  priority?: TaskRecord['priority'];
  status?: TaskRecord['status'];
  dueDate?: FirestoreDate;
  attachments?: Array<Partial<TaskAttachment> & { uploadedAt?: FirestoreDate }>;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

interface TaskCommentDocument extends FirestoreRecord {
  taskId?: string;
  content?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
}

interface TaskActivityDocument extends FirestoreRecord {
  taskId?: string;
  type?: TaskActivityType;
  actorId?: string;
  actorName?: string;
  message?: string;
  meta?: Record<string, unknown>;
  createdAt?: FirestoreDate;
}

interface TaskUserDocument extends FirestoreRecord {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  image?: string;
  photoURL?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  lastLoginAt?: FirestoreDate;
  lastLogin?: FirestoreDate;
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return !!value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function';
}

function toDate(value: FirestoreDate): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (isTimestampLike(value)) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function mapAttachment(raw: Partial<TaskAttachment> & { uploadedAt?: FirestoreDate }): TaskAttachment {
  return {
    id: raw.id || crypto.randomUUID(),
    name: raw.name || 'Attachment',
    url: raw.url || '',
    path: raw.path || '',
    size: raw.size || 0,
    contentType: raw.contentType || 'application/octet-stream',
    uploadedBy: raw.uploadedBy || '',
    uploadedAt: toDate(raw.uploadedAt) || new Date(),
  };
}

function mapTask(docId: string, data: TaskDocument): TaskRecord {
  return {
    id: docId,
    code: data.code || '',
    title: data.title || '',
    description: data.description || '',
    createdBy: data.createdBy || '',
    assigneeIds: data.assigneeIds || [],
    watcherIds: data.watcherIds || [],
    priority: data.priority || 'medium',
    status: data.status || 'new',
    dueDate: toDate(data.dueDate),
    attachments: Array.isArray(data.attachments) ? data.attachments.map(mapAttachment) : [],
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt) || new Date(),
  };
}

function mapComment(docId: string, data: TaskCommentDocument): TaskComment {
  return {
    id: docId,
    taskId: data.taskId || '',
    content: data.content || '',
    createdBy: data.createdBy || '',
    createdByName: data.createdByName || '',
    createdAt: toDate(data.createdAt) || new Date(),
    updatedAt: toDate(data.updatedAt),
  };
}

function mapActivity(docId: string, data: TaskActivityDocument): TaskActivity {
  return {
    id: docId,
    taskId: data.taskId || '',
    type: data.type || 'updated',
    actorId: data.actorId || '',
    actorName: data.actorName || '',
    message: data.message || '',
    meta: data.meta || {},
    createdAt: toDate(data.createdAt) || new Date(),
  };
}

function mapUser(docId: string, data: TaskUserDocument): TaskUserProfile {
  return {
    id: docId,
    name: data.name || data.email || 'Unknown user',
    email: data.email || '',
    role: data.role || 'trainer',
    ticketRole: mapToTicketRole(data.role),
    isActive: data.isActive ?? true,
    image: data.image || data.photoURL || undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    lastLoginAt: toDate(data.lastLoginAt || data.lastLogin),
  };
}

async function createTaskCode(): Promise<string> {
  const countersRef = doc(db, TASK_META_COLLECTION, COUNTERS_DOC_ID);
  const nextValue = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(countersRef);
    const current = snapshot.exists() ? snapshot.data().nextTaskNumber || 0 : 0;
    const nextTaskNumber = current + 1;
    transaction.set(countersRef, { nextTaskNumber, updatedAt: serverTimestamp() }, { merge: true });
    return nextTaskNumber;
  });

  return `TASK-${String(nextValue).padStart(4, '0')}`;
}

async function logActivity(input: {
  taskId: string;
  actorId: string;
  actorName?: string;
  type: TaskActivityType;
  message: string;
  meta?: Record<string, unknown>;
}) {
  await addDoc(collection(db, TASK_ACTIVITIES_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

async function deleteCollectionByTaskId(collectionName: string, taskId: string) {
  const snapshot = await getDocs(query(collection(db, collectionName), where('taskId', '==', taskId)));
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((docItem) => {
    batch.delete(docItem.ref);
  });
  await batch.commit();
}

async function deleteTaskAttachmentsFromStorage(taskId: string) {
  const folderRef = ref(storage, `task-attachments/${taskId}`);

  try {
    const result = await listAll(folderRef);
    await Promise.all(result.items.map((item) => deleteObject(item)));
    await Promise.all(result.prefixes.map((prefix) => deleteTaskAttachmentsByPrefix(prefix)));
  } catch (error) {
    console.warn(`Could not fully clean storage for task ${taskId}:`, error);
  }
}

async function deleteTaskAttachmentsByPrefix(prefixRef: ReturnType<typeof ref>) {
  const result = await listAll(prefixRef);
  await Promise.all(result.items.map((item) => deleteObject(item)));
  await Promise.all(result.prefixes.map((prefix) => deleteTaskAttachmentsByPrefix(prefix)));
}

async function uploadTaskAttachments(taskId: string, userId: string, files: File[]): Promise<TaskAttachment[]> {
  if (!files.length) return [];

  const uploads = await Promise.all(
    files.map(async (file) => {
      const safeName = `${Date.now()}-${file.name}`;
      const path = `task-attachments/${taskId}/${safeName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        path,
        size: file.size,
        contentType: file.type,
        uploadedBy: userId,
        uploadedAt: new Date(),
      } satisfies TaskAttachment;
    }),
  );

  return uploads;
}

async function getRelatedTaskIds(userId: string) {
  const queries = [
    query(collection(db, TASKS_COLLECTION), where('createdBy', '==', userId)),
    query(collection(db, TASKS_COLLECTION), where('assigneeIds', 'array-contains', userId)),
    query(collection(db, TASKS_COLLECTION), where('watcherIds', 'array-contains', userId)),
  ];

  const snapshots = await Promise.all(queries.map((item) => getDocs(item)));
  return Array.from(new Set(snapshots.flatMap((snapshot) => snapshot.docs.map((docItem) => docItem.id))));
}

export const taskSystemService = {
  subscribeToTasks(
    params: { userId: string; role?: string; filters?: TaskFilters },
    callback: (tasks: TaskRecord[]) => void,
  ) {
    const run = async () => {
      if (isTaskAdmin(params.role)) {
        const q = query(collection(db, TASKS_COLLECTION), orderBy('updatedAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
          callback(applyFilters(snapshot.docs.map((item) => mapTask(item.id, item.data())), params.filters));
        });
      }

      const taskIds = await getRelatedTaskIds(params.userId);

      if (!taskIds.length) {
        callback([]);
        return () => undefined;
      }

      const chunk = taskIds.slice(0, 30);
      const q = query(collection(db, TASKS_COLLECTION), where(documentId(), 'in', chunk));
      return onSnapshot(q, (snapshot) => {
        const mapped = snapshot.docs.map((item) => mapTask(item.id, item.data()));
        const visible = filterVisibleTasks(mapped, params.userId, params.role);
        callback(applyFilters(visible, params.filters));
      });
    };

    let unsubscribe: (() => void) | undefined;
    run().then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  },

  subscribeToTask(taskId: string, callback: (task: TaskRecord | null) => void) {
    return onSnapshot(doc(db, TASKS_COLLECTION, taskId), (snapshot) => {
      callback(snapshot.exists() ? mapTask(snapshot.id, snapshot.data()) : null);
    });
  },

  subscribeToComments(taskId: string, callback: (comments: TaskComment[]) => void) {
    const q = query(
      collection(db, TASK_COMMENTS_COLLECTION),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => mapComment(item.id, item.data()))));
  },

  subscribeToActivities(taskId: string, callback: (activities: TaskActivity[]) => void) {
    const q = query(
      collection(db, TASK_ACTIVITIES_COLLECTION),
      where('taskId', '==', taskId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => mapActivity(item.id, item.data()))));
  },

  subscribeToUsers(callback: (users: TaskUserProfile[]) => void) {
    const q = query(collection(db, USERS_COLLECTION), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => mapUser(item.id, item.data()))));
  },

  async createTask(values: TaskFormValues, actor: { id: string; name?: string }) {
    const code = await createTaskCode();
    const taskRef = doc(collection(db, TASKS_COLLECTION));
    const attachments = await uploadTaskAttachments(taskRef.id, actor.id, values.attachments || []);

    await setDoc(taskRef, {
      code,
      title: values.title,
      description: values.description,
      createdBy: actor.id,
      assigneeIds: values.assigneeIds,
      watcherIds: values.watcherIds,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate ? Timestamp.fromDate(new Date(values.dueDate)) : null,
      attachments,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await logActivity({
      taskId: taskRef.id,
      actorId: actor.id,
      actorName: actor.name,
      type: 'created',
      message: `created task ${code}`,
    });

    return taskRef.id;
  },

  async updateTaskContent(taskId: string, values: TaskFormValues, actor: { id: string; name?: string }) {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const attachments = await uploadTaskAttachments(taskId, actor.id, values.attachments || []);

    await updateDoc(taskRef, {
      title: values.title,
      description: values.description,
      assigneeIds: values.assigneeIds,
      watcherIds: values.watcherIds,
      priority: values.priority,
      dueDate: values.dueDate ? Timestamp.fromDate(new Date(values.dueDate)) : null,
      updatedAt: serverTimestamp(),
      ...(attachments.length ? { attachments: arrayUnion(...attachments) } : {}),
    });

    await logActivity({
      taskId,
      actorId: actor.id,
      actorName: actor.name,
      type: 'updated',
      message: 'updated task content',
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus, actor: { id: string; name?: string }) {
    await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
      status,
      updatedAt: serverTimestamp(),
    });

    await logActivity({
      taskId,
      actorId: actor.id,
      actorName: actor.name,
      type: 'status_changed',
      message: `changed status to ${status}`,
      meta: { status },
    });
  },

  async deleteTask(taskId: string, actor: { id: string; name?: string }) {
    const snapshot = await getDoc(doc(db, TASKS_COLLECTION, taskId));
    const taskData: TaskDocument | null = snapshot.exists() ? (snapshot.data() as TaskDocument) : null;

    if (snapshot.exists()) {
      await logActivity({
        taskId,
        actorId: actor.id,
        actorName: actor.name,
        type: 'deleted',
        message: `deleted task ${taskData?.code || taskId}`,
      });
    }

    await Promise.all([
      deleteCollectionByTaskId(TASK_COMMENTS_COLLECTION, taskId),
      deleteCollectionByTaskId(TASK_ACTIVITIES_COLLECTION, taskId),
      deleteTaskAttachmentsFromStorage(taskId),
      deleteDoc(doc(db, TASK_META_COLLECTION, taskId)).catch(() => undefined),
    ]);

    if (taskData && Array.isArray(taskData.attachments)) {
      await Promise.all(
        taskData.attachments
          .map((attachment: { path?: string }) => attachment?.path)
          .filter(isDefined)
          .map((path) => deleteObject(ref(storage, path)).catch(() => undefined)),
      );
    }

    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  },

  async addComment(taskId: string, content: string, actor: { id: string; name?: string }) {
    await addDoc(collection(db, TASK_COMMENTS_COLLECTION), {
      taskId,
      content,
      createdBy: actor.id,
      createdByName: actor.name || 'Unknown user',
      createdAt: serverTimestamp(),
      updatedAt: null,
    });

    await logActivity({
      taskId,
      actorId: actor.id,
      actorName: actor.name,
      type: 'commented',
      message: 'added a comment',
    });
  },

  async updateUserRole(userId: string, role: string) {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      role,
      updatedAt: serverTimestamp(),
    });
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },
};

function applyFilters(tasks: TaskRecord[], filters?: TaskFilters) {
  let output = [...tasks].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  if (!filters) return output;

  const keyword = filters.keyword?.trim().toLowerCase();
  const today = new Date();

  if (keyword) {
    output = output.filter((task) =>
      [task.code, task.title, task.description].some((value) => value.toLowerCase().includes(keyword)),
    );
  }

  if (filters.status && filters.status !== 'all') {
    output = output.filter((task) => task.status === filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    output = output.filter((task) => task.priority === filters.priority);
  }

  if (filters.assigneeId && filters.assigneeId !== 'all') {
    output = output.filter((task) => task.assigneeIds.includes(filters.assigneeId!));
  }

  if (filters.creatorId && filters.creatorId !== 'all') {
    output = output.filter((task) => task.createdBy === filters.creatorId);
  }

  if (filters.watcherId && filters.watcherId !== 'all') {
    output = output.filter((task) => task.watcherIds.includes(filters.watcherId!));
  }

  if (filters.due && filters.due !== 'all') {
    output = output.filter((task) => {
      if (!task.dueDate) return false;
      const due = task.dueDate;
      if (filters.due === 'overdue') return due < today && !['done', 'cancelled'].includes(task.status);
      if (filters.due === 'today') return due.toDateString() === today.toDateString();
      if (filters.due === 'upcoming') return due >= today;
      return true;
    });
  }

  return output;
}
