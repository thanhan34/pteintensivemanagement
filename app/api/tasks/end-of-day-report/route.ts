import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { authOptions } from '@/app/config/auth';
import { db } from '@/app/config/firebase';

type RawTask = {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  dueDate?: { toDate?: () => Date } | Date;
  assignedTo?: string[];
};

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDate = (value: RawTask['dueDate']): Date => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) return value;
  return new Date();
};

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userDoc = await getDoc(doc(db, 'users', session.user.id));
    const userData = userDoc.exists() ? (userDoc.data() as { discordWebhookUrl?: string }) : null;
    const webhookUrl = userData?.discordWebhookUrl?.trim();

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn chưa cấu hình Discord webhook trong Settings.'
        },
        { status: 400 }
      );
    }

    const taskQuery = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', session.user.id));
    const taskSnapshot = await getDocs(taskQuery);

    const todayKey = toDateKey(new Date());
    const assignedTasks = taskSnapshot.docs.map((taskDoc) => ({ id: taskDoc.id, ...(taskDoc.data() as RawTask) }));
    const todayTasks = assignedTasks.filter((task) => toDateKey(toDate(task.dueDate)) === todayKey);

    const doneTasks = todayTasks.filter((task) => task.status === 'done');
    const inProgressTasks = todayTasks.filter((task) => task.status === 'in_progress');
    const todoTasks = todayTasks.filter((task) => task.status === 'todo');

    const summaryLines = [
      `✅ Done: ${doneTasks.length}`,
      `🔄 In Progress: ${inProgressTasks.length}`,
      `📝 To Do: ${todoTasks.length}`,
      `📌 Total: ${todayTasks.length}`
    ];

    const completedList = doneTasks.length
      ? doneTasks.slice(0, 10).map((task, index) => `${index + 1}. ${task.title || 'Untitled task'}`).join('\n')
      : 'Chưa có task hoàn thành hôm nay';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `📊 **Báo cáo cuối ngày** - ${session.user.name || session.user.email}`,
        embeds: [
          {
            title: 'Daily Task Report',
            color: 0xfc5d01,
            fields: [
              {
                name: 'Tổng quan',
                value: summaryLines.join('\n'),
                inline: false
              },
              {
                name: 'Task đã hoàn thành',
                value: completedList,
                inline: false
              }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gửi Discord webhook thất bại. Vui lòng kiểm tra URL webhook trong Settings.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi báo cáo cuối ngày lên Discord.'
    });
  } catch (error) {
    console.error('Error sending end-of-day report:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể gửi báo cáo cuối ngày. Vui lòng thử lại sau.'
      },
      { status: 500 }
    );
  }
}
