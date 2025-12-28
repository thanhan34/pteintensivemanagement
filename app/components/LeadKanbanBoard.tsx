'use client';

import { useState } from 'react';
import { Lead, LeadStatus, getLeadStatusColor, getLeadSourceLabel } from '../types/lead';
import { User } from '../types/roles';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Target
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadKanbanBoardProps {
  leads: Lead[];
  users: User[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onLeadClick: (lead: Lead) => void;
}

interface KanbanColumn {
  id: LeadStatus;
  title: string;
  leads: Lead[];
}

interface LeadCardProps {
  lead: Lead;
  users: User[];
  onLeadClick: (lead: Lead) => void;
}

function LeadCard({ lead, users, onLeadClick }: LeadCardProps) {
  const assignee = users.find(u => u.id === lead.assignedTo);
  const isOverdue = lead.nextFollowUpAt && isPast(new Date(lead.nextFollowUpAt)) && lead.status !== 'converted' && lead.status !== 'lost';

  const formatFollowUpDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Hôm nay';
    if (isTomorrow(d)) return 'Ngày mai';
    return format(d, 'dd/MM/yyyy');
  };

  return (
    <Card
      className={cn(
        "mb-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
        lead.status === 'converted' && "opacity-75 bg-green-50",
        lead.status === 'lost' && "opacity-60 bg-red-50",
        isOverdue && "border-red-300 bg-red-50"
      )}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onLeadClick(lead)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight text-[#fc5d01]">
                {lead.fullName}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-600">{lead.phone}</span>
              </div>
            </div>
            <Badge
              style={{ 
                backgroundColor: getLeadStatusColor(lead.status) + '20',
                color: getLeadStatusColor(lead.status),
                borderColor: getLeadStatusColor(lead.status)
              }}
              className="text-xs border"
            >
              {getLeadSourceLabel(lead.source)}
            </Badge>
          </div>

          {/* Target & Course */}
          {(lead.targetPTE || lead.suggestedCourseName) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {lead.targetPTE && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Target className="h-3 w-3" />
                  <span>PTE {lead.targetPTE}</span>
                </div>
              )}
              {lead.suggestedCourseName && (
                <div className="flex items-center gap-1 text-gray-600">
                  <span className="font-medium">{lead.suggestedCourseName}</span>
                </div>
              )}
            </div>
          )}

          {/* Quoted Fee */}
          {lead.quotedFee && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <DollarSign className="h-3 w-3" />
              <span>{lead.quotedFee.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          )}

          {/* Follow-up Date */}
          {lead.nextFollowUpAt && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-red-600 font-medium" : "text-gray-600"
            )}>
              <Calendar className="h-3 w-3" />
              <span>Follow-up: {formatFollowUpDate(lead.nextFollowUpAt)}</span>
              {isOverdue && <AlertTriangle className="h-3 w-3 ml-1" />}
            </div>
          )}

          {/* Assignee */}
          {assignee && (
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 border-t">
              <span>👨‍💼 {assignee.name}</span>
            </div>
          )}

          {/* Converted Indicator */}
          {lead.status === 'converted' && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Đã convert → Student</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadKanbanBoard({ leads, users, onStatusChange, onLeadClick }: LeadKanbanBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Define columns
  const columns: KanbanColumn[] = [
    {
      id: 'lead_new',
      title: 'Lead Mới',
      leads: leads.filter(lead => lead.status === 'lead_new')
    },
    {
      id: 'consulted',
      title: 'Đã Tư Vấn',
      leads: leads.filter(lead => lead.status === 'consulted')
    },
    {
      id: 'interested',
      title: 'Quan Tâm',
      leads: leads.filter(lead => lead.status === 'interested')
    },
    {
      id: 'closed',
      title: 'Đóng Deal',
      leads: leads.filter(lead => lead.status === 'closed')
    },
    {
      id: 'paid',
      title: 'Đã Thanh Toán',
      leads: leads.filter(lead => lead.status === 'paid')
    },
    {
      id: 'converted',
      title: 'Đã Convert',
      leads: leads.filter(lead => lead.status === 'converted')
    },
    {
      id: 'lost',
      title: 'Mất Lead',
      leads: leads.filter(lead => lead.status === 'lost')
    }
  ];

  const getColumnColor = (status: LeadStatus) => {
    const color = getLeadStatusColor(status);
    return {
      border: `${color}40`,
      bg: `${color}10`
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    
    if (leadId && leadId !== draggedLeadId) {
      onStatusChange(leadId, newStatus);
    }
    
    setDraggedLeadId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-[calc(100vh-250px)]">
      {columns.map((column) => {
        const colors = getColumnColor(column.id);
        return (
          <div
            key={column.id}
            className={cn(
              "flex flex-col rounded-lg border-2 border-dashed transition-colors",
              draggedLeadId && "border-primary/50"
            )}
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="p-3 border-b bg-white/80 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getLeadStatusColor(column.id) }}
                  />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: getLeadStatusColor(column.id) + '20',
                      color: getLeadStatusColor(column.id)
                    }}
                  >
                    {column.leads.length}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {column.leads.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground text-xs">
                      Chưa có lead nào
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kéo lead vào đây
                    </p>
                  </div>
                ) : (
                  column.leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      users={users}
                      onLeadClick={onLeadClick}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
