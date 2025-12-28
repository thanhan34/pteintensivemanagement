# Lead/CRM System Documentation

## 📋 Overview

The Lead/CRM system is a module integrated into the PTE Management System to manage potential students (leads) before they become enrolled students. This system follows the principle of **NON-INTERFERENCE** with existing student management logic.

### Key Principles

- ✅ **Lead = Pre-Student**: Leads are potential students who haven't paid yet
- ✅ **Automatic Conversion**: When a lead pays, they're converted to Student (no manual data entry)
- ✅ **Modular Design**: CRM is a separate module that doesn't modify existing Student logic
- ✅ **Role-Based Access**: Admin and Saler roles can access the system

---

## 🎯 Features

### 1. Lead Management
- Create, update, and delete leads
- Track lead information: name, phone, email, Facebook, Zalo
- Record target PTE score, visa purpose, timeline
- Suggest courses and quote fees
- Add notes and observations

### 2. Kanban Board
- Visual pipeline with 7 stages:
  - **Lead Mới** (New Lead)
  - **Đã Tư Vấn** (Consulted)
  - **Quan Tâm** (Interested)
  - **Đóng Deal** (Deal Closed)
  - **Đã Thanh Toán** (Paid) - Ready to convert
  - **Đã Convert** (Converted to Student)
  - **Mất Lead** (Lost Lead)
- Drag & drop to change lead status
- Color-coded by status
- Shows key information on cards

### 3. Lead Assignment
- **Manual Assignment**: Admin/Saler selects consultant
- **Auto Assignment**: Round-robin algorithm distributes leads evenly
- Tracks who assigned the lead and when

### 4. Follow-up Management
- Set follow-up dates for each lead
- Visual indicators for overdue follow-ups
- Automatic reminders via Discord (daily at 9 AM)

### 5. Lead Conversion
- One-click conversion from Lead → Student
- Available when lead status = "Paid"
- Automatically maps all lead data to student fields
- Preserves lead history in notes
- Sends Discord notification on conversion

### 6. Discord Integration
- **New Lead**: Notifies when a lead is created
- **Overdue Follow-up**: Daily reminders for overdue leads
- **Lead Converted**: Celebrates successful conversions
- **Status Change**: Alerts for important status changes (Paid, Lost)

### 7. Consultation Logs (Ready for future implementation)
- Track all interactions with leads
- Types: Call, Chat, Follow-up, Note, Status Change
- Timeline view of lead journey

---

## 👥 Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: Create, edit, delete, view all leads, convert, assign |
| **Saler** | View assigned leads, edit own leads, convert own leads |
| **Other Roles** | No access to Leads module |

---

## 🗂️ Database Schema

### Collection: `leads`

```typescript
{
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  facebook?: string;
  zalo?: string;
  
  source: 'facebook' | 'zalo' | 'website' | 'referral' | 'other';
  status: 'lead_new' | 'consulted' | 'interested' | 'closed' | 'paid' | 'converted' | 'lost';
  
  assignedTo: string;  // userId of saler (consultant)
  assignedBy?: string; // userId of who assigned
  assignmentType: 'manual' | 'auto';
  
  createdAt: string;
  createdBy: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  
  targetPTE?: number;
  visaPurpose?: string;
  expectedTimeline?: string;
  
  suggestedCourseName?: string;  // Text field (not a reference)
  quotedFee?: number;
  
  notes?: string;
  convertedStudentId?: string;
  convertedAt?: string;
}
```

### Collection: `consultation_logs`

```typescript
{
  id: string;
  leadId: string;
  userId: string;
  userName: string;
  actionType: 'call' | 'chat' | 'follow_up' | 'note' | 'status_change' | 'assignment';
  content: string;
  createdAt: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: string;
    newAssignee?: string;
  };
}
```

---

## 🔄 Lead → Student Conversion

### Conversion Conditions
- Lead status must be "paid"
- Lead must not have been converted already

### Field Mapping

| Lead Field | Student Field | Notes |
|------------|---------------|-------|
| fullName | name | Direct mapping |
| phone | phone | Direct mapping |
| source | referrer | Converted to readable format |
| targetPTE | targetScore | Direct mapping |
| quotedFee | tuitionFee | Direct mapping |
| suggestedCourseName | notes | Included in notes section |
| email, facebook, zalo | notes | Preserved in notes |
| visaPurpose | notes | Included in study info |
| expectedTimeline | notes | Included in study info |

### Conversion Process
1. Validate lead status and conversion eligibility
2. Create new Student record with mapped data
3. Update Lead: set convertedStudentId and status to 'converted'
4. Create consultation log entry
5. Send Discord notification
6. Redirect user to Students page

### Generated Student Notes Format
```
📝 Ghi chú từ Lead:
[Original notes from lead]

📱 Thông tin liên hệ:
Email: [email]
Facebook: [facebook]
Zalo: [zalo]

🎓 Thông tin học tập:
Mục đích: [visaPurpose]
Timeline: [expectedTimeline]
Khóa học đề xuất: [suggestedCourseName]

---
🔄 Converted from Lead ID: [leadId]
📅 Lead created: [date]
✅ Converted: [date]
```

---

## 🔔 Discord Notifications

### Webhook Configuration
Set the webhook URL in `.env.local`:
```env
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

Currently configured:
```
https://discord.com/api/webhooks/1454885747008999671/U2AQAxrXzyLUC0_ma7TU4mTQzencgGnPvzsQq7J1fqgz-EiiXwv1OuOJYhGlQh8vz8eA
```

### Notification Types

#### 1. New Lead Created
- **Trigger**: When a new lead is added
- **Content**: Name, phone, source, assigned consultant, target PTE

#### 2. Overdue Follow-up
- **Trigger**: Daily at 9 AM (via cron job)
- **Content**: Lead name, phone, overdue date, assigned consultant

#### 3. Lead Converted
- **Trigger**: When lead is converted to student
- **Content**: Lead name, phone, tuition fee, course, consultant, student ID

#### 4. Important Status Change
- **Trigger**: When lead status changes to "Paid" or "Lost"
- **Content**: Lead name, old status, new status, consultant

---

## ⏰ Cron Jobs

### Lead Follow-up Reminder

**Schedule**: Daily at 9:00 AM (Asia/Bangkok timezone)

**Endpoint**: `/api/lead-followup-reminder`

**Function**: Checks for leads with overdue follow-up dates and sends Discord notifications

**Configuration** (in `vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/lead-followup-reminder",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Testing**: 
```bash
# Test the cron job manually
POST /api/lead-followup-reminder
```

---

## 🚀 Usage Guide

### For Admin

#### Creating a New Lead
1. Navigate to **Leads** page
2. Click **"Thêm Lead Mới"** button
3. Fill in the form:
   - Basic info: Name, phone, email
   - Contact: Facebook, Zalo
   - Study info: Target PTE, visa purpose, timeline, suggested course, quoted fee
   - Assignment: Select consultant OR click "Auto" for automatic assignment
   - Follow-up: Set next follow-up date
   - Notes: Add any observations
4. Click **"Tạo Lead"**

#### Managing Leads
- **Change Status**: Drag & drop lead cards between columns
- **View Details**: Click on any lead card
- **Edit Lead**: Click lead card → Click "Chỉnh Sửa"
- **Convert to Student**: Click lead card → Click "Convert → Student" (only when status = Paid)

#### Monitoring
- View statistics dashboard showing:
  - Total leads
  - Active consultations
  - Paid leads (ready to convert)
  - Converted leads
- Check overdue follow-ups (red highlighted cards)

### For Saler (Sales Consultant)

#### Viewing Assigned Leads
1. Navigate to **Leads** page
2. See only leads assigned to you
3. Kanban board shows your lead pipeline

#### Updating Lead Status
- Drag lead cards to update status as you progress with consultation
- Update follow-up dates when scheduling next contact

#### Converting Leads
- When a lead pays, move to "Đã Thanh Toán" column
- Click the lead → Click "Convert → Student"
- System automatically creates student record
- You'll be redirected to Students page to complete remaining info (DOB, province, etc.)

---

## 🛠️ Technical Architecture

### File Structure

```
app/
├── types/
│   ├── lead.ts                    # Lead type definitions
│   └── consultationLog.ts         # Consultation log types
├── utils/
│   ├── leadService.ts             # CRUD operations for leads
│   ├── leadConverter.ts           # Lead → Student conversion logic
│   ├── consultationLogService.ts  # Consultation log operations
│   └── discordNotification.ts     # Discord webhook integration
├── components/
│   ├── LeadForm.tsx               # Lead creation/edit form
│   ├── LeadKanbanBoard.tsx        # Kanban board visualization
│   └── Navigation.tsx             # Updated with Leads menu
├── leads/
│   └── page.tsx                   # Main leads page
└── api/
    └── lead-followup-reminder/
        └── route.ts               # Cron job endpoint
```

### Key Functions

#### leadService.ts
- `getAllLeads()`: Get all leads (admin)
- `getLeadsByAssignee()`: Get leads for specific consultant
- `createLead()`: Create new lead with auto-assignment logic
- `updateLead()`: Update lead information
- `updateLeadStatus()`: Change lead status
- `getOverdueLeads()`: Get leads with overdue follow-ups
- `autoAssignLead()`: Round-robin assignment algorithm

#### leadConverter.ts
- `convertLeadToStudent()`: Main conversion function
- `canConvertLead()`: Validation check
- `getStudentFromLead()`: Get student ID from converted lead

#### discordNotification.ts
- `notifyNewLead()`: New lead notification
- `notifyOverdueFollowUp()`: Overdue reminder
- `notifyLeadConverted()`: Conversion success
- `notifyLeadStatusChange()`: Important status changes

---

## 🔐 Security

### API Route Protection
- Lead follow-up reminder endpoint uses `CRON_SECRET` for authentication
- Page-level access control checks user role
- Firestore security rules should be updated to restrict lead collection access

### Recommended Firestore Rules

```javascript
match /leads/{leadId} {
  // Admin can do everything
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Saler can read and update their assigned leads
  allow read, update: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'saler' &&
    resource.data.assignedTo == request.auth.uid;
  
  // Saler can create new leads
  allow create: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'saler';
}

match /consultation_logs/{logId} {
  // Admin can read all
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  
  // Saler can read logs for their assigned leads
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'saler' &&
    get(/databases/$(database)/documents/leads/$(resource.data.leadId)).data.assignedTo == request.auth.uid;
  
  // Anyone can create logs (will be validated on backend)
  allow create: if request.auth != null;
}
```

---

## 📊 Analytics & Reporting (Future Enhancement)

Potential reports to add:
- Conversion rate by source
- Average time from lead to conversion
- Consultant performance metrics
- Lead quality scoring
- Revenue forecasting based on pipeline

---

## 🐛 Troubleshooting

### Discord Notifications Not Working
1. Check webhook URL in `.env.local`
2. Test webhook: `curl -X POST WEBHOOK_URL -H "Content-Type: application/json" -d '{"content":"Test"}'`
3. Check console logs for errors

### Lead Not Converting
1. Verify lead status is "paid"
2. Check if lead has already been converted
3. Look for errors in browser console
4. Check Firebase permissions

### Cron Job Not Running
1. Verify `vercel.json` configuration
2. Check Vercel dashboard → Project → Cron Jobs
3. Ensure `CRON_SECRET` is set in environment variables
4. Test endpoint manually: `POST /api/lead-followup-reminder`

### Auto-Assignment Not Working
1. Ensure there are users with role="saler" in database
2. Check console logs for errors
3. Verify Firestore read permissions for users collection

---

## 🔮 Future Enhancements

### Phase 1 (Completed)
- ✅ Lead CRUD operations
- ✅ Kanban board
- ✅ Lead conversion
- ✅ Discord notifications
- ✅ Follow-up reminders
- ✅ Auto-assignment

### Phase 2 (Planned)
- [ ] Consultation timeline view
- [ ] Quick log entry from Kanban cards
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Lead import from CSV/Excel

### Phase 3 (Future)
- [ ] Lead scoring system
- [ ] Email integration
- [ ] SMS reminders
- [ ] WhatsApp integration
- [ ] Advanced analytics dashboard
- [ ] Automated follow-up templates
- [ ] Lead capture forms (public-facing)

---

## 📝 Changelog

### Version 1.0.0 (2025-12-29)
- Initial release of Lead/CRM system
- Kanban board with 7 stages
- Lead creation and management
- Automatic conversion to Students
- Discord notifications
- Follow-up reminder cron job
- Auto-assignment with round-robin
- Role-based permissions (Admin, Saler)

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Check Discord webhook configuration
4. Verify Firebase permissions
5. Contact system administrator

---

**Last Updated**: December 29, 2025
**Version**: 1.0.0
