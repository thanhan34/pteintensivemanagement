import { NextResponse } from 'next/server';
import { getOverdueLeads } from '../../utils/leadService';
import { notifyOverdueFollowUp } from '../../utils/discordNotification';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export async function GET(request: Request) {
  try {
    // Verify the request is from a cron job (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Lead follow-up reminder cron job started');

    // Get overdue leads
    const overdueLeads = await getOverdueLeads();
    
    if (overdueLeads.length === 0) {
      console.log('✅ No overdue leads found');
      return NextResponse.json({
        success: true,
        message: 'No overdue leads',
        count: 0
      });
    }

    console.log(`📋 Found ${overdueLeads.length} overdue leads`);

    // Send notifications for each overdue lead
    const notifications = await Promise.allSettled(
      overdueLeads.map(async (lead) => {
        try {
          // Get assignee name
          const assigneeDoc = await getDoc(doc(db, 'users', lead.assignedTo));
          const assigneeName = assigneeDoc.exists() 
            ? assigneeDoc.data()?.name 
            : 'Unknown';

          // Send Discord notification
          await notifyOverdueFollowUp(lead, assigneeName);

          console.log(`✅ Notification sent for lead: ${lead.fullName} (${lead.id})`);
          
          return {
            leadId: lead.id,
            leadName: lead.fullName,
            assignee: assigneeName,
            success: true
          };
        } catch (error) {
          console.error(`❌ Error sending notification for lead ${lead.id}:`, error);
          return {
            leadId: lead.id,
            leadName: lead.fullName,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successful = notifications.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = notifications.length - successful;

    console.log(`✅ Lead follow-up reminders sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${overdueLeads.length} overdue leads`,
      stats: {
        total: overdueLeads.length,
        successful,
        failed
      },
      results: notifications.map((result) => 
        result.status === 'fulfilled' ? result.value : { error: 'Failed' }
      )
    });

  } catch (error) {
    console.error('❌ Error in lead follow-up reminder cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Test endpoint - remove in production or add authentication
export async function POST() {
  try {
    console.log('🧪 Testing lead follow-up reminder...');
    
    const overdueLeads = await getOverdueLeads();
    
    return NextResponse.json({
      success: true,
      message: 'Test successful',
      overdueLeadsCount: overdueLeads.length,
      leads: overdueLeads.map(lead => ({
        id: lead.id,
        name: lead.fullName,
        phone: lead.phone,
        nextFollowUpAt: lead.nextFollowUpAt,
        assignedTo: lead.assignedTo
      }))
    });
  } catch (error) {
    console.error('❌ Error testing lead follow-up reminder:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
