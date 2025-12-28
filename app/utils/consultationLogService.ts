import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { ConsultationLog, ConsultationActionType } from '../types/consultationLog';

// Get all consultation logs for a lead
export async function getConsultationLogsByLead(leadId: string): Promise<ConsultationLog[]> {
  try {
    const q = query(
      collection(db, 'consultation_logs'),
      where('leadId', '==', leadId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConsultationLog[];
  } catch (error) {
    console.error('Error fetching consultation logs:', error);
    throw new Error('Failed to fetch consultation logs');
  }
}

// Add a new consultation log
export async function addConsultationLog(
  leadId: string,
  userId: string,
  userName: string,
  actionType: ConsultationActionType,
  content: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    const logData = {
      leadId,
      userId,
      userName,
      actionType,
      content,
      createdAt: new Date().toISOString(),
      metadata: metadata || {}
    };

    const docRef = await addDoc(collection(db, 'consultation_logs'), logData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding consultation log:', error);
    throw new Error('Failed to add consultation log');
  }
}

// Add a status change log
export async function logStatusChange(
  leadId: string,
  userId: string,
  userName: string,
  oldStatus: string,
  newStatus: string
): Promise<string> {
  const content = `Thay đổi trạng thái từ "${oldStatus}" sang "${newStatus}"`;
  return addConsultationLog(
    leadId,
    userId,
    userName,
    'status_change',
    content,
    { oldStatus, newStatus }
  );
}

// Add an assignment log
export async function logAssignment(
  leadId: string,
  userId: string,
  userName: string,
  oldAssignee: string,
  newAssignee: string
): Promise<string> {
  const content = `Phân công từ "${oldAssignee}" sang "${newAssignee}"`;
  return addConsultationLog(
    leadId,
    userId,
    userName,
    'assignment',
    content,
    { oldAssignee, newAssignee }
  );
}

// Get consultation logs statistics
export async function getConsultationStats(leadId: string): Promise<{
  totalLogs: number;
  callCount: number;
  chatCount: number;
  followUpCount: number;
  lastContact?: string;
}> {
  try {
    const logs = await getConsultationLogsByLead(leadId);
    
    return {
      totalLogs: logs.length,
      callCount: logs.filter(log => log.actionType === 'call').length,
      chatCount: logs.filter(log => log.actionType === 'chat').length,
      followUpCount: logs.filter(log => log.actionType === 'follow_up').length,
      lastContact: logs.length > 0 ? logs[0].createdAt : undefined
    };
  } catch (error) {
    console.error('Error fetching consultation stats:', error);
    throw new Error('Failed to fetch consultation stats');
  }
}
