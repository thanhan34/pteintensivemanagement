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

// Task Services
export const taskService = {
  // Create a new task
  async createTask(taskData: CreateTaskData, userId: string): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        ...taskData,
        createdBy: userId,
        status: 'todo' as TaskStatus,
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
      let q = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
      
      // Apply filters
      if (filter?.status && filter.status.length > 0) {
        q = query(q, where('status', 'in', filter.status));
      }
      
      if (filter?.priority && filter.priority.length > 0) {
        q = query(q, where('priority', 'in', filter.priority));
      }
      
      if (filter?.assignedTo && filter.assignedTo.length > 0) {
        q = query(q, where('assignedTo', 'array-contains-any', filter.assignedTo));
      }
      
      if (filter?.projectId) {
        q = query(q, where('projectId', '==', filter.projectId));
      }

      const querySnapshot = await getDocs(q);
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

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  // Get tasks assigned to a specific user
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('assignedTo', 'array-contains', userId),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
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

      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  },

  // Get tasks by project
  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, TASKS_COLLECTION),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
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

      return tasks;
    } catch (error) {
      console.error('Error getting tasks by project:', error);
      throw error;
    }
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
