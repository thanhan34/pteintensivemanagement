import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { Lead, LeadFormData, LeadStatus } from '../types/lead';
import { User } from '../types/roles';
import { notifyNewLead, notifyLeadStatusChange } from './discordNotification';

// Get all leads
export async function getAllLeads(): Promise<Lead[]> {
  try {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw new Error('Failed to fetch leads');
  }
}

// Get leads by assignee
export async function getLeadsByAssignee(userId: string): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('assignedTo', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
  } catch (error) {
    console.error('Error fetching leads by assignee:', error);
    throw new Error('Failed to fetch leads');
  }
}

// Get leads by status
export async function getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lead[];
  } catch (error) {
    console.error('Error fetching leads by status:', error);
    throw new Error('Failed to fetch leads');
  }
}

// Get a single lead by ID
export async function getLeadById(leadId: string): Promise<Lead | null> {
  try {
    const leadDoc = await getDoc(doc(db, 'leads', leadId));
    if (!leadDoc.exists()) {
      return null;
    }
    return {
      id: leadDoc.id,
      ...leadDoc.data()
    } as Lead;
  } catch (error) {
    console.error('Error fetching lead:', error);
    throw new Error('Failed to fetch lead');
  }
}

// Get all salers (for assignment)
export async function getAllSalers(): Promise<User[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'saler'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  } catch (error) {
    console.error('Error fetching salers:', error);
    throw new Error('Failed to fetch salers');
  }
}

// Round-robin assignment logic
export async function autoAssignLead(): Promise<string | null> {
  try {
    // Get all salers
    const salers = await getAllSalers();
    
    if (salers.length === 0) {
      console.error('No salers available for assignment');
      return null;
    }

    // Get active leads count for each saler
    const salerLeadCounts = await Promise.all(
      salers.map(async (saler) => {
        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', saler.id),
          where('status', 'in', ['lead_new', 'consulted', 'interested', 'closed', 'paid'])
        );
        const querySnapshot = await getDocs(q);
        return {
          salerId: saler.id,
          salerName: saler.name,
          leadCount: querySnapshot.size
        };
      })
    );

    // Find saler with minimum leads
    salerLeadCounts.sort((a, b) => {
      if (a.leadCount === b.leadCount) {
        return a.salerName.localeCompare(b.salerName); // Alphabetical if equal
      }
      return a.leadCount - b.leadCount;
    });

    return salerLeadCounts[0].salerId;
  } catch (error) {
    console.error('Error in auto-assign:', error);
    return null;
  }
}

// Create a new lead
export async function createLead(
  formData: LeadFormData,
  createdBy: string,
  createdByName: string
): Promise<string> {
  try {
    // If assignedTo is empty and assignmentType is auto, auto-assign
    let assignedTo = formData.assignedTo;
    if (!assignedTo || formData.assignmentType === 'auto') {
      const autoAssignedId = await autoAssignLead();
      if (autoAssignedId) {
        assignedTo = autoAssignedId;
      } else {
        throw new Error('No saler available for assignment');
      }
    }

    const leadData = {
      ...formData,
      assignedTo,
      createdBy,
      createdAt: new Date().toISOString(),
      lastContactAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'leads'), leadData);

    // Get assignee name for notification
    const assigneeDoc = await getDoc(doc(db, 'users', assignedTo));
    const assigneeName = assigneeDoc.exists() ? assigneeDoc.data()?.name : 'Unknown';

    // Send Discord notification
    await notifyNewLead(
      {
        id: docRef.id,
        ...leadData
      } as Lead,
      assigneeName
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw new Error('Failed to create lead');
  }
}

// Update a lead
export async function updateLead(
  leadId: string,
  formData: Partial<LeadFormData>
): Promise<void> {
  try {
    const leadRef = doc(db, 'leads', leadId);
    
    // Get old lead data for status change notification
    const oldLeadDoc = await getDoc(leadRef);
    const oldLead = oldLeadDoc.data() as Lead;

    await updateDoc(leadRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    });

    // If status changed to paid or lost, send notification
    if (formData.status && formData.status !== oldLead.status) {
      const assigneeDoc = await getDoc(doc(db, 'users', oldLead.assignedTo));
      const assigneeName = assigneeDoc.exists() ? assigneeDoc.data()?.name : 'Unknown';
      
      await notifyLeadStatusChange(
        {
          ...oldLead,
          ...formData,
          id: leadId
        } as Lead,
        oldLead.status,
        formData.status,
        assigneeName
      );
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    throw new Error('Failed to update lead');
  }
}

// Update lead status (for drag & drop)
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus
): Promise<void> {
  try {
    await updateLead(leadId, { status: newStatus });
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw new Error('Failed to update lead status');
  }
}

// Update lead assignment
export async function reassignLead(
  leadId: string,
  newAssigneeId: string,
  assignedBy: string
): Promise<void> {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      assignedTo: newAssigneeId,
      assignedBy,
      assignmentType: 'manual',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reassigning lead:', error);
    throw new Error('Failed to reassign lead');
  }
}

// Delete a lead
export async function deleteLead(leadId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'leads', leadId));
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw new Error('Failed to delete lead');
  }
}

// Update follow-up date
export async function updateFollowUpDate(
  leadId: string,
  nextFollowUpAt: string
): Promise<void> {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      nextFollowUpAt,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating follow-up date:', error);
    throw new Error('Failed to update follow-up date');
  }
}

// Get overdue leads (for cron job)
export async function getOverdueLeads(): Promise<Lead[]> {
  try {
    const now = new Date().toISOString();
    const allLeads = await getAllLeads();
    
    // Filter leads with overdue follow-up dates
    return allLeads.filter(lead => 
      lead.nextFollowUpAt && 
      lead.nextFollowUpAt < now &&
      lead.status !== 'converted' &&
      lead.status !== 'lost'
    );
  } catch (error) {
    console.error('Error fetching overdue leads:', error);
    throw new Error('Failed to fetch overdue leads');
  }
}

// Mark lead as contacted (update lastContactAt)
export async function markLeadContacted(leadId: string): Promise<void> {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      lastContactAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking lead as contacted:', error);
    throw new Error('Failed to mark lead as contacted');
  }
}

// Get lead statistics
export async function getLeadStatistics(): Promise<{
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<string, number>;
  conversionRate: number;
}> {
  try {
    const leads = await getAllLeads();
    
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);

    const bySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const converted = byStatus.converted || 0;
    const total = leads.length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      byStatus,
      bySource,
      conversionRate
    };
  } catch (error) {
    console.error('Error fetching lead statistics:', error);
    throw new Error('Failed to fetch lead statistics');
  }
}
