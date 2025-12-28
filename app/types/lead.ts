export type LeadSource = 'facebook' | 'zalo' | 'website' | 'referral' | 'other';

export type LeadStatus = 
  | 'lead_new'      // Lead mới
  | 'consulted'     // Đã tư vấn
  | 'interested'    // Quan tâm
  | 'closed'        // Đóng deal (chưa thanh toán)
  | 'paid'          // Đã thanh toán (sẵn sàng convert)
  | 'converted'     // Đã convert thành Student
  | 'lost';         // Mất lead

export type AssignmentType = 'manual' | 'auto';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  facebook?: string;
  zalo?: string;
  
  source: LeadSource;
  status: LeadStatus;
  
  assignedTo: string;  // userId của saler (tư vấn viên)
  assignedBy?: string; // userId của người assign (admin)
  assignmentType: AssignmentType; // manual hoặc auto
  
  createdAt: string;
  createdBy: string;  // userId của người tạo
  lastContactAt?: string;
  nextFollowUpAt?: string;
  
  targetPTE?: number;
  visaPurpose?: string;
  expectedTimeline?: string;
  
  suggestedCourseName?: string;  // Tên khóa học đề xuất (text, không reference)
  quotedFee?: number;
  
  notes?: string;
  convertedStudentId?: string;  // null khi chưa convert, studentId khi đã convert
  convertedAt?: string;
}

export type LeadFormData = Omit<Lead, 'id' | 'createdAt' | 'createdBy' | 'convertedStudentId' | 'convertedAt'>;

// Helper functions for Lead status
export const getLeadStatusLabel = (status: LeadStatus): string => {
  const labels: Record<LeadStatus, string> = {
    lead_new: 'Lead Mới',
    consulted: 'Đã Tư Vấn',
    interested: 'Quan Tâm',
    closed: 'Đóng Deal',
    paid: 'Đã Thanh Toán',
    converted: 'Đã Convert',
    lost: 'Mất Lead'
  };
  return labels[status];
};

export const getLeadStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    lead_new: '#fc5d01',        // Cam đậm
    consulted: '#ffac7b',       // Cam sáng
    interested: '#fdbc94',      // Cam nhạt
    closed: '#fd7f33',          // Cam rực
    paid: '#22c55e',            // Xanh (ready to convert)
    converted: '#10b981',       // Xanh đậm
    lost: '#ef4444'             // Đỏ
  };
  return colors[status];
};

export const getLeadSourceLabel = (source: LeadSource): string => {
  const labels: Record<LeadSource, string> = {
    facebook: 'Facebook',
    zalo: 'Zalo',
    website: 'Website',
    referral: 'Giới Thiệu',
    other: 'Khác'
  };
  return labels[source];
};
