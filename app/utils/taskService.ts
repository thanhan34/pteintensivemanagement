import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Task, 
  Project, 
  Label, 
  UserStats,
  CreateTaskData,
  CreateProjectData,
  CreateLabelData,
  TaskFilter,
  TaskStatus
} from '../types/task';

const ADMIN_ROLE = 'admin';

// Collections
const TASKS_COLLECTION = 'tasks';
const PROJECTS_COLLECTION = 'projects';
const LABELS_COLLECTION = 'labels';
const USER_STATS_COLLECTION = 'user_stats';

// Helper function to convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp | { toDate(): Date } | Date | null): Date => {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

// Helper function to convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const canPerformTaskCleanup = (viewerRole?: string): boolean => {
  // Only admin (or system calls without viewer role) should execute destructive cleanup
  return !viewerRole || viewerRole === ADMIN_ROLE;
};

const isDoneTaskExpired = (task: Task, todayKey: string): boolean => {
  if (task.status !== 'done') return false;

  const completedDate = task.completedAt ?? task.updatedAt ?? task.createdAt;
  return toDateKey(completedDate) < todayKey;
};

const parseTaskFromDoc = (docData: { id: string; data: () => Record<string, unknown> }): Task => {
  const data = docData.data();
  return {
    id: docData.id,
    ...data,
    dueDate: timestampToDate(data.dueDate as Timestamp),
    reminderTime: data.reminderTime ? timestampToDate(data.reminderTime as Timestamp) : undefined,
    completedAt: data.completedAt ? timestampToDate(data.completedAt as Timestamp) : undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp),
    updatedAt: timestampToDate(data.updatedAt as Timestamp)
  } as Task;
};

const canViewTask = (task: Task, viewerUserId?: string, viewerRole?: string): boolean => {
  if (!viewerUserId) return true;
  if (viewerRole === ADMIN_ROLE) return true;
  return task.assignedTo.includes(viewerUserId) || task.createdBy === viewerUserId;
};

const applyTaskFilters = (tasks: Task[], filter?: TaskFilter): Task[] => {
  let filtered = [...tasks];

  if (!filter?.includeTemplates) {
    filtered = filtered.filter(task => !task.isTemplate);
  }

  filtered = filtered.filter(task => canViewTask(task, filter?.viewerUserId, filter?.viewerRole));

  if (filter?.status?.length) {
    filtered = filtered.filter(task => filter.status?.includes(task.status));
  }

  if (filter?.priority?.length) {
    filtered = filtered.filter(task => filter.priority?.includes(task.priority));
  }

  if (filter?.assignedTo?.length) {
    filtered = filtered.filter(task => task.assignedTo.some(userId => filter.assignedTo?.includes(userId)));
  }

  if (filter?.projectId) {
    filtered = filtered.filter(task => task.projectId === filter.projectId);
  }

  if (filter?.labels?.length) {
    filtered = filtered.filter(task => task.labels.some(labelId => filter.labels?.includes(labelId)));
  }

  if (filter?.today) {
    const todayKey = toDateKey(new Date());
    filtered = filtered.filter(task => toDateKey(new Date(task.dueDate)) === todayKey);
  }

  if (filter?.overdue) {
    const now = new Date();
    filtered = filtered.filter(task => task.status !== 'done' && new Date(task.dueDate) < now);
  }

  if (filter?.dueDate?.from) {
    filtered = filtered.filter(task => new Date(task.dueDate) >= filter.dueDate!.from!);
  }

  if (filter?.dueDate?.to) {
    filtered = filtered.filter(task => new Date(task.dueDate) <= filter.dueDate!.to!);
  }

  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Task Services
export const taskService = {
  // Create a new task
  async createTask(taskData: CreateTaskData, userId: string): Promise<string> {
    try {
      const taskCategory = taskData.isRecurring && taskData.recurringPattern === 'daily'
        ? 'recurring_daily'
        : 'ad_hoc';

      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        ...taskData,
        createdBy: userId,
        status: 'todo' as TaskStatus,
        taskCategory,
        isTemplate: taskData.isRecurring && taskData.recurringPattern === 'daily',
        dueDate: dateToTimestamp(taskData.dueDate),
        reminderTime: taskData.reminderTime ? dateToTimestamp(taskData.reminderTime) : null,
        completedAt: null,
        createdAt: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Get all tasks with optional filtering
  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    try {
      const q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const allTasks = querySnapshot.docs.map((doc) => parseTaskFromDoc(doc));

      const now = new Date();
      const todayKey = toDateKey(now);

      const expiredDoneTasks = allTasks.filter(task => isDoneTaskExpired(task, todayKey));

      if (expiredDoneTasks.length > 0 && canPerformTaskCleanup(filter?.viewerRole)) {
        try {
          const cleanupBatch = writeBatch(db);

          expiredDoneTasks.forEach((task) => {
            cleanupBatch.delete(doc(db, TASKS_COLLECTION, task.id));
          });

          await cleanupBatch.commit();
        } catch (cleanupError) {
          console.error('Error cleaning up expired done tasks:', cleanupError);
        }
      }

      const activeTasks = allTasks.filter(task => !isDoneTaskExpired(task, todayKey));

      // Auto-generate daily task instances from recurring templates
      const recurringTemplates = activeTasks.filter(
        task => task.isTemplate && task.isRecurring && task.recurringPattern === 'daily'
      );

      const missingInstances = recurringTemplates.filter(template => {
        return !activeTasks.some(task =>
          task.sourceRecurringTaskId === template.id && task.recurrenceDateKey === todayKey
        );
      });
      const generatedTasks: Task[] = [];

      for (const template of missingInstances) {
        const templateDueDate = new Date(template.dueDate);
        const instanceDueDate = new Date(now);
        instanceDueDate.setHours(
          templateDueDate.getHours(),
          templateDueDate.getMinutes(),
          templateDueDate.getSeconds(),
          0
        );

        const payload = {
          title: template.title,
          description: template.description,
          dueDate: dateToTimestamp(instanceDueDate),
          priority: template.priority,
          status: 'todo' as TaskStatus,
          createdBy: template.createdBy,
          assignedTo: template.assignedTo,
          projectId: template.projectId || null,
          labels: template.labels,
          isRecurring: false,
          recurringPattern: template.recurringPattern,
          reminderTime: template.reminderTime ? dateToTimestamp(template.reminderTime) : null,
          completedAt: null,
          sourceRecurringTaskId: template.id,
          recurrenceDateKey: todayKey,
          isTemplate: false,
          taskCategory: 'recurring_daily',
          createdAt: dateToTimestamp(now),
          updatedAt: dateToTimestamp(now)
        };

        const createdDoc = await addDoc(collection(db, TASKS_COLLECTION), payload);
        generatedTasks.push({
          id: createdDoc.id,
          title: payload.title,
          description: payload.description,
          dueDate: instanceDueDate,
          priority: payload.priority,
          status: payload.status,
          createdBy: payload.createdBy,
          assignedTo: payload.assignedTo,
          projectId: template.projectId,
          labels: payload.labels,
          isRecurring: payload.isRecurring,
          recurringPattern: template.recurringPattern,
          reminderTime: template.reminderTime,
          completedAt: undefined,
          sourceRecurringTaskId: payload.sourceRecurringTaskId,
          recurrenceDateKey: payload.recurrenceDateKey,
          isTemplate: false,
          taskCategory: payload.taskCategory,
          createdAt: now,
          updatedAt: now
        });
      }

      return applyTaskFilters([...activeTasks, ...generatedTasks], filter);
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  // Get tasks assigned to a specific user
  async getUserTasks(userId: string): Promise<Task[]> {
    return this.getTasks({
      assignedTo: [userId],
      viewerUserId: userId,
      viewerRole: 'trainer'
    });
  },

  // Get tasks by project
  async getTasksByProject(projectId: string, filter?: Omit<TaskFilter, 'projectId'>): Promise<Task[]> {
    return this.getTasks({
      ...filter,
      projectId
    });
  },

  // Update task
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: dateToTimestamp(new Date())
      };

      // Convert dates to timestamps
      if (updates.dueDate) {
        updateData.dueDate = dateToTimestamp(updates.dueDate);
      }
      if (updates.reminderTime) {
        updateData.reminderTime = dateToTimestamp(updates.reminderTime);
      }
      if (updates.completedAt) {
        updateData.completedAt = dateToTimestamp(updates.completedAt);
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Mark task as complete
  async completeTask(taskId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update task
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      batch.update(taskRef, {
        status: 'done',
        completedAt: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date())
      });

      // Update user stats
      const userStatsRef = doc(db, USER_STATS_COLLECTION, userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const currentStats = userStatsDoc.data() as UserStats;
        batch.update(userStatsRef, {
          tasksCompleted: currentStats.tasksCompleted + 1,
          karmaPoints: currentStats.karmaPoints + 10, // 10 points per completed task
          lastUpdated: dateToTimestamp(new Date())
        });
      } else {
        batch.set(userStatsRef, {
          userId,
          tasksCompleted: 1,
          karmaPoints: 10,
          weeklyStats: [],
          monthlyStats: [],
          lastUpdated: dateToTimestamp(new Date())
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Subscribe to task changes
  subscribeToTasks(callback: (tasks: Task[]) => void, filter?: TaskFilter) {
    let q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
    
    // Apply filters (simplified for real-time subscription)
    if (filter?.status && filter.status.length > 0) {
      q = query(q, where('status', 'in', filter.status));
    }

    return onSnapshot(q, (querySnapshot) => {
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          dueDate: timestampToDate(data.dueDate),
          reminderTime: data.reminderTime ? timestampToDate(data.reminderTime) : undefined,
          completedAt: data.completedAt ? timestampToDate(data.completedAt) : undefined,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt)
        } as Task);
      });
      callback(tasks);
    });
  }
};

// Project Services
export const projectService = {
  // Create project
  async createProject(projectData: CreateProjectData, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
        ...projectData,
        createdBy: userId,
        createdAt: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Get all projects
  async getProjects(): Promise<Project[]> {
    try {
      const q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt)
        } as Project);
      });

      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: dateToTimestamp(new Date())
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Get single project
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, PROJECTS_COLLECTION, projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt)
        } as Project;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  // Invite member to project
  async inviteMember(projectId: string, userId: string): Promise<void> {
    try {
      const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data() as Project;
        const currentMembers = projectData.members || [];
        
        // Add userId to members if not already present
        if (!currentMembers.includes(userId)) {
          await updateDoc(projectRef, {
            members: [...currentMembers, userId],
            updatedAt: dateToTimestamp(new Date())
          });
        }
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  }
};

// Label Services
export const labelService = {
  // Create label
  async createLabel(labelData: CreateLabelData, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, LABELS_COLLECTION), {
        ...labelData,
        createdBy: userId,
        createdAt: dateToTimestamp(new Date())
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    }
  },

  // Get all labels
  async getLabels(): Promise<Label[]> {
    try {
      const q = query(collection(db, LABELS_COLLECTION), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const labels: Label[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        labels.push({
          id: doc.id,
          ...data,
          createdAt: timestampToDate(data.createdAt)
        } as Label);
      });

      return labels;
    } catch (error) {
      console.error('Error getting labels:', error);
      throw error;
    }
  },

  // Delete label
  async deleteLabel(labelId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, LABELS_COLLECTION, labelId));
    } catch (error) {
      console.error('Error deleting label:', error);
      throw error;
    }
  }
};

// User Services
export const userService = {
  // Get all users
  async getUsers(): Promise<Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  }>> {
    try {
      const q = query(collection(db, 'users'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const users: Array<{
        id: string;
        name?: string;
        email?: string;
        role?: string;
      }> = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          ...data
        });
      });

      return users;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }
};

// User Stats Services
export const userStatsService = {
  // Get user stats
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const docRef = doc(db, USER_STATS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastUpdated: timestampToDate(data.lastUpdated)
        } as UserStats;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<UserStats[]> {
    try {
      const q = query(
        collection(db, USER_STATS_COLLECTION),
        orderBy('karmaPoints', 'desc'),
        orderBy('tasksCompleted', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const stats: UserStats[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.push({
          ...data,
          lastUpdated: timestampToDate(data.lastUpdated)
        } as UserStats);
      });

      return stats.slice(0, limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
};
