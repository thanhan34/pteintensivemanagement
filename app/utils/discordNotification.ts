import { Lead } from '../types/lead';

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || 
  'https://discord.com/api/webhooks/1454885747008999671/U2AQAxrXzyLUC0_ma7TU4mTQzencgGnPvzsQq7J1fqgz-EiiXwv1OuOJYhGlQh8vz8eA';

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

// Helper function to send Discord notification
async function sendDiscordNotification(message: DiscordMessage): Promise<boolean> {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

// Notification for new lead
export async function notifyNewLead(lead: Lead, assignedToName: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🆕 Lead Mới',
    color: 0xfc5d01, // Orange
    fields: [
      {
        name: '👤 Tên',
        value: lead.fullName,
        inline: true
      },
      {
        name: '📱 Phone',
        value: lead.phone,
        inline: true
      },
      {
        name: '📍 Nguồn',
        value: lead.source.charAt(0).toUpperCase() + lead.source.slice(1),
        inline: true
      },
      {
        name: '👨‍💼 Tư vấn viên',
        value: assignedToName,
        inline: true
      },
      {
        name: '🎯 Target PTE',
        value: lead.targetPTE ? lead.targetPTE.toString() : 'Chưa xác định',
        inline: true
      },
      {
        name: '📧 Email',
        value: lead.email || 'Không có',
        inline: true
      }
    ],
    footer: {
      text: `Lead ID: ${lead.id}`
    },
    timestamp: new Date().toISOString()
  };

  if (lead.notes) {
    embed.fields?.push({
      name: '📝 Ghi chú',
      value: lead.notes.substring(0, 200) + (lead.notes.length > 200 ? '...' : ''),
      inline: false
    });
  }

  return sendDiscordNotification({
    content: '**Lead mới vừa được thêm vào hệ thống!**',
    embeds: [embed]
  });
}

// Notification for overdue follow-up
export async function notifyOverdueFollowUp(lead: Lead, assignedToName: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '⚠️ Lead Quá Hạn Follow-up',
    color: 0xef4444, // Red
    fields: [
      {
        name: '👤 Tên',
        value: lead.fullName,
        inline: true
      },
      {
        name: '📱 Phone',
        value: lead.phone,
        inline: true
      },
      {
        name: '📅 Hạn Follow-up',
        value: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString('vi-VN') : 'Không xác định',
        inline: true
      },
      {
        name: '👨‍💼 Tư vấn viên',
        value: assignedToName,
        inline: true
      },
      {
        name: '📊 Trạng thái',
        value: lead.status,
        inline: true
      },
      {
        name: '📍 Nguồn',
        value: lead.source.charAt(0).toUpperCase() + lead.source.slice(1),
        inline: true
      }
    ],
    footer: {
      text: `Lead ID: ${lead.id}`
    },
    timestamp: new Date().toISOString()
  };

  return sendDiscordNotification({
    content: `**⚠️ Lead quá hạn follow-up!** <@${assignedToName}>`,
    embeds: [embed]
  });
}

// Notification for lead converted to student
export async function notifyLeadConverted(
  lead: Lead, 
  studentId: string, 
  assignedToName: string
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '✅ Lead Đã Convert → Student',
    color: 0x10b981, // Green
    fields: [
      {
        name: '👤 Tên',
        value: lead.fullName,
        inline: true
      },
      {
        name: '📱 Phone',
        value: lead.phone,
        inline: true
      },
      {
        name: '💰 Học phí',
        value: lead.quotedFee ? `${lead.quotedFee.toLocaleString('vi-VN')} VNĐ` : 'Chưa xác định',
        inline: true
      },
      {
        name: '👨‍💼 Tư vấn viên',
        value: assignedToName,
        inline: true
      },
      {
        name: '📚 Khóa học',
        value: lead.suggestedCourseName || 'Chưa xác định',
        inline: true
      },
      {
        name: '🎯 Target PTE',
        value: lead.targetPTE ? lead.targetPTE.toString() : 'Chưa xác định',
        inline: true
      },
      {
        name: '🔗 Student ID',
        value: studentId,
        inline: false
      }
    ],
    footer: {
      text: `Lead ID: ${lead.id} → Student ID: ${studentId}`
    },
    timestamp: new Date().toISOString()
  };

  return sendDiscordNotification({
    content: '**🎉 Chúc mừng! Lead đã được convert thành Student thành công!**',
    embeds: [embed]
  });
}

// Notification for lead status change (optional - for important status changes)
export async function notifyLeadStatusChange(
  lead: Lead,
  oldStatus: string,
  newStatus: string,
  assignedToName: string
): Promise<boolean> {
  // Only notify for important status changes
  const importantStatuses = ['paid', 'lost'];
  if (!importantStatuses.includes(newStatus)) {
    return true; // Skip notification
  }

  const color = newStatus === 'paid' ? 0x22c55e : 0xef4444;
  const icon = newStatus === 'paid' ? '💰' : '❌';

  const embed: DiscordEmbed = {
    title: `${icon} Lead Thay Đổi Trạng Thái`,
    color: color,
    fields: [
      {
        name: '👤 Tên',
        value: lead.fullName,
        inline: true
      },
      {
        name: '📱 Phone',
        value: lead.phone,
        inline: true
      },
      {
        name: '🔄 Trạng thái',
        value: `${oldStatus} → **${newStatus}**`,
        inline: false
      },
      {
        name: '👨‍💼 Tư vấn viên',
        value: assignedToName,
        inline: true
      }
    ],
    footer: {
      text: `Lead ID: ${lead.id}`
    },
    timestamp: new Date().toISOString()
  };

  return sendDiscordNotification({
    content: newStatus === 'paid' ? '**💰 Lead đã thanh toán! Sẵn sàng convert.**' : '**Lead đã bị mất.**',
    embeds: [embed]
  });
}

// Test Discord webhook
export async function testDiscordWebhook(): Promise<boolean> {
  return sendDiscordNotification({
    content: '✅ Test Discord webhook thành công! PTE Management System đang hoạt động.',
    embeds: [{
      title: '🔔 Test Notification',
      description: 'Hệ thống thông báo Discord đang hoạt động bình thường.',
      color: 0xfc5d01,
      timestamp: new Date().toISOString()
    }]
  });
}
