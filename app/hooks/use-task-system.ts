'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { taskSystemService } from '@/app/services/task-system.service';
import { TaskActivity, TaskComment, TaskFilters, TaskRecord, TaskUserProfile } from '@/app/types/task-system';
import { getTaskPermissions, getTaskStats } from '@/app/utils/task-system-permissions';

export function useTaskUsers() {
  const [users, setUsers] = useState<TaskUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = taskSystemService.subscribeToUsers((nextUsers) => {
      setUsers(nextUsers);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { users, loading };
}

export function useTaskList(filters?: TaskFilters) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const unsubscribe = taskSystemService.subscribeToTasks(
      {
        userId: session.user.id,
        role: session.user.role,
        filters,
      },
      (nextTasks) => {
        setTasks(nextTasks);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [filters?.assigneeId, filters?.creatorId, filters?.due, filters?.keyword, filters?.priority, filters?.status, filters?.watcherId, session?.user?.id, session?.user?.role]);

  const stats = useMemo(() => getTaskStats(tasks, session?.user?.id), [tasks, session?.user?.id]);

  return { tasks, stats, loading };
}

export function useTaskDetail(taskId?: string) {
  const { data: session } = useSession();
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const unsubscribers = [
      taskSystemService.subscribeToTask(taskId, (nextTask) => {
        setTask(nextTask);
        setLoading(false);
      }),
      taskSystemService.subscribeToComments(taskId, setComments),
      taskSystemService.subscribeToActivities(taskId, setActivities),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [taskId]);

  const permissions = useMemo(
    () => getTaskPermissions(task, session?.user?.id, session?.user?.role),
    [session?.user?.id, session?.user?.role, task],
  );

  return { task, comments, activities, permissions, loading };
}
