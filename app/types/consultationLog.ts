export type ConsultationActionType = 
  | 'call'          // Gọi điện
  | 'chat'          // Chat (Zalo, Facebook, etc.)
  | 'follow_up'     // Follow-up
  | 'note'          // Ghi chú
  | 'status_change' // Thay đổi trạng thái
  | 'assignment';   // Phân công tư vấn viên

export interface ConsultationLog {
  id: string;
  leadId: string;
  userId: string;      // User thực hiện action
  userName: string;    // Cache tên user cho hiển thị nhanh
  actionType: ConsultationActionType;
  content: string;
  createdAt: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: string;
    newAssignee?: string;
    [key: string]: string | undefined;
  };
}

export type ConsultationLogFormData = Omit<ConsultationLog, 'id' | 'createdAt' | 'userId' | 'userName'>;

// Helper function to get action type label
export const getActionTypeLabel = (actionType: ConsultationActionType): string => {
  const labels: Record<ConsultationActionType, string> = {
    call: '📞 Gọi điện',
    chat: '💬 Chat',
    follow_up: '📅 Follow-up',
    note: '📝 Ghi chú',
    status_change: '🔄 Đổi trạng thái',
    assignment: '👤 Phân công'
  };
  return labels[actionType];
};

// Helper function to get action type icon
export const getActionTypeIcon = (actionType: ConsultationActionType): string => {
  const icons: Record<ConsultationActionType, string> = {
    call: '📞',
    chat: '💬',
    follow_up: '📅',
    note: '📝',
    status_change: '🔄',
    assignment: '👤'
  };
  return icons[actionType];
};

// Helper function to get action type color
export const getActionTypeColor = (actionType: ConsultationActionType): string => {
  const colors: Record<ConsultationActionType, string> = {
    call: '#fc5d01',        // Cam đậm
    chat: '#ffac7b',        // Cam sáng
    follow_up: '#fdbc94',   // Cam nhạt
    note: '#fed ac2',       // Cam nhạt rất nhẹ
    status_change: '#fd7f33', // Cam rực
    assignment: '#fc5d01'   // Cam đậm
  };
  return colors[actionType];
};
