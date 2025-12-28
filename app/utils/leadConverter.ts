import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Lead } from '../types/lead';
import { StudentFormData } from '../types/student';
import { notifyLeadConverted } from './discordNotification';

/**
 * Convert a Lead to a Student
 * This function does NOT modify the existing Student structure
 * It creates a new Student from Lead data following the mapping rules
 */
export async function convertLeadToStudent(leadId: string): Promise<string> {
  try {
    // 1. Get lead data
    const leadDoc = await getDoc(doc(db, 'leads', leadId));
    if (!leadDoc.exists()) {
      throw new Error('Lead not found');
    }

    const lead = { id: leadDoc.id, ...leadDoc.data() } as Lead;

    // 2. Validate conversion conditions
    if (lead.status !== 'paid') {
      throw new Error('Lead must have status "paid" to be converted');
    }

    if (lead.convertedStudentId) {
      throw new Error('Lead has already been converted');
    }

    // 3. Map Lead fields to Student fields
    const studentData: StudentFormData = {
      // Basic info
      name: lead.fullName,
      phone: lead.phone,
      dob: '', // Not in Lead, will need to be updated manually
      
      // Source/Referral info
      referrer: mapLeadSourceToReferrer(lead),
      province: '', // Not in Lead, will need to be updated manually
      country: '', // Not in Lead, will need to be updated manually
      
      // PTE Target
      targetScore: lead.targetPTE || 0,
      
      // Course info
      startDate: new Date().toISOString().split('T')[0], // Today
      studyDuration: 6, // Default 6 months, can be updated
      type: 'one-on-one' as const, // Default type, can be updated
      
      // Payment info
      tuitionFee: lead.quotedFee || 0,
      tuitionPaymentDates: [new Date().toISOString().split('T')[0]], // First payment today
      tuitionPaymentStatus: 'paid' as const, // Since lead status is 'paid'
      
      // Trainer (will need to be assigned)
      trainerName: '', // Will be assigned by admin later
      
      // Notes - Include all Lead info that doesn't have direct mapping
      notes: buildStudentNotes(lead),
      
      // Optional fields
      isProcess: false
    };

    // 4. Create Student
    const studentRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      convertedFromLeadId: leadId // Track which lead this came from
    });

    // 5. Update Lead with conversion info
    await updateDoc(doc(db, 'leads', leadId), {
      convertedStudentId: studentRef.id,
      convertedAt: new Date().toISOString(),
      status: 'converted',
      updatedAt: new Date().toISOString()
    });

    // 6. Get assignee name for notification
    const assigneeDoc = await getDoc(doc(db, 'users', lead.assignedTo));
    const assigneeName = assigneeDoc.exists() ? assigneeDoc.data()?.name : 'Unknown';

    // 7. Send Discord notification
    await notifyLeadConverted(lead, studentRef.id, assigneeName);

    // 8. Log conversion in consultation logs
    await addDoc(collection(db, 'consultation_logs'), {
      leadId: leadId,
      userId: lead.assignedTo,
      userName: assigneeName,
      actionType: 'status_change',
      content: `Lead đã được convert thành Student (ID: ${studentRef.id})`,
      createdAt: new Date().toISOString(),
      metadata: {
        oldStatus: 'paid',
        newStatus: 'converted',
        studentId: studentRef.id
      }
    });

    return studentRef.id;
  } catch (error) {
    console.error('Error converting lead to student:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to convert lead');
  }
}

/**
 * Map Lead source to Student referrer format
 */
function mapLeadSourceToReferrer(lead: Lead): string {
  const sourceMap: Record<string, string> = {
    facebook: 'Facebook',
    zalo: 'Zalo',
    website: 'Website',
    referral: 'Giới thiệu',
    other: 'Khác'
  };
  
  return sourceMap[lead.source] || 'Unknown';
}

/**
 * Build comprehensive notes for Student from Lead data
 * This preserves information that doesn't have direct field mapping
 */
function buildStudentNotes(lead: Lead): string {
  const notesParts: string[] = [];

  // Original lead notes
  if (lead.notes) {
    notesParts.push(`📝 Ghi chú từ Lead:\n${lead.notes}`);
  }

  // Contact info that Student doesn't have dedicated fields for
  const contactInfo: string[] = [];
  if (lead.email) contactInfo.push(`Email: ${lead.email}`);
  if (lead.facebook) contactInfo.push(`Facebook: ${lead.facebook}`);
  if (lead.zalo) contactInfo.push(`Zalo: ${lead.zalo}`);
  
  if (contactInfo.length > 0) {
    notesParts.push(`📱 Thông tin liên hệ:\n${contactInfo.join('\n')}`);
  }

  // Study info
  const studyInfo: string[] = [];
  if (lead.visaPurpose) studyInfo.push(`Mục đích: ${lead.visaPurpose}`);
  if (lead.expectedTimeline) studyInfo.push(`Timeline: ${lead.expectedTimeline}`);
  if (lead.suggestedCourseName) studyInfo.push(`Khóa học đề xuất: ${lead.suggestedCourseName}`);
  
  if (studyInfo.length > 0) {
    notesParts.push(`🎓 Thông tin học tập:\n${studyInfo.join('\n')}`);
  }

  // Lead tracking info
  notesParts.push(`\n---\n🔄 Converted from Lead ID: ${lead.id}`);
  notesParts.push(`📅 Lead created: ${new Date(lead.createdAt).toLocaleString('vi-VN')}`);
  notesParts.push(`✅ Converted: ${new Date().toLocaleString('vi-VN')}`);

  return notesParts.join('\n\n');
}

/**
 * Check if a lead can be converted
 */
export async function canConvertLead(leadId: string): Promise<{
  canConvert: boolean;
  reason?: string;
}> {
  try {
    const leadDoc = await getDoc(doc(db, 'leads', leadId));
    if (!leadDoc.exists()) {
      return { canConvert: false, reason: 'Lead not found' };
    }

    const lead = leadDoc.data() as Lead;

    if (lead.status !== 'paid') {
      return { 
        canConvert: false, 
        reason: 'Lead phải có trạng thái "Đã Thanh Toán" mới có thể convert' 
      };
    }

    if (lead.convertedStudentId) {
      return { 
        canConvert: false, 
        reason: 'Lead đã được convert rồi' 
      };
    }

    return { canConvert: true };
  } catch (error) {
    console.error('Error checking if lead can be converted:', error);
    return { 
      canConvert: false, 
      reason: 'Lỗi khi kiểm tra điều kiện convert' 
    };
  }
}

/**
 * Get student info from converted lead
 */
export async function getStudentFromLead(leadId: string): Promise<string | null> {
  try {
    const leadDoc = await getDoc(doc(db, 'leads', leadId));
    if (!leadDoc.exists()) {
      return null;
    }

    const lead = leadDoc.data() as Lead;
    return lead.convertedStudentId || null;
  } catch (error) {
    console.error('Error getting student from lead:', error);
    return null;
  }
}
