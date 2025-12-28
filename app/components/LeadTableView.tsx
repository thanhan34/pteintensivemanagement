'use client';

import { useState } from 'react';
import { Lead, getLeadStatusLabel, getLeadStatusColor, getLeadSourceLabel } from '../types/lead';
import { User } from '../types/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, 
  Edit, 
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Target,
  AlertTriangle
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadTableViewProps {
  leads: Lead[];
  users: User[];
  onLeadClick: (lead: Lead) => void;
  onEditClick: (lead: Lead) => void;
  onConvertClick: (lead: Lead) => void;
}

export default function LeadTableView({
  leads,
  users,
  onLeadClick,
  onEditClick,
  onConvertClick
}: LeadTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Lead>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter leads based on search term
  const filteredLeads = leads.filter(lead => 
    lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (column: keyof Lead) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getAssigneeName = (assignedTo: string) => {
    const user = users.find(u => u.id === assignedTo);
    return user?.name || 'N/A';
  };

  const isOverdue = (lead: Lead) => {
    return lead.nextFollowUpAt && 
           isPast(new Date(lead.nextFollowUpAt)) && 
           lead.status !== 'converted' && 
           lead.status !== 'lost';
  };

  const canConvert = (lead: Lead) => {
    return lead.status === 'paid' && !lead.convertedStudentId;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Tìm kiếm theo tên, số điện thoại, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md border-[#fc5d01]/30 focus:border-[#fc5d01]"
        />
        <div className="text-sm text-gray-600">
          Hiển thị {sortedLeads.length} / {leads.length} leads
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#fc5d01]/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#fedac2] hover:bg-[#fedac2]">
              <TableHead 
                className="cursor-pointer font-semibold text-[#fc5d01]"
                onClick={() => handleSort('fullName')}
              >
                Họ và Tên {sortColumn === 'fullName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="font-semibold text-[#fc5d01]">
                Liên hệ
              </TableHead>
              <TableHead 
                className="cursor-pointer font-semibold text-[#fc5d01]"
                onClick={() => handleSort('source')}
              >
                Nguồn {sortColumn === 'source' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer font-semibold text-[#fc5d01]"
                onClick={() => handleSort('status')}
              >
                Trạng thái {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer font-semibold text-[#fc5d01]"
                onClick={() => handleSort('assignedTo')}
              >
                Tư vấn viên {sortColumn === 'assignedTo' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="font-semibold text-[#fc5d01]">
                Thông tin học tập
              </TableHead>
              <TableHead className="font-semibold text-[#fc5d01]">
                Follow-up
              </TableHead>
              <TableHead className="text-right font-semibold text-[#fc5d01]">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Không tìm thấy lead nào' : 'Chưa có lead nào'}
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={cn(
                    "cursor-pointer hover:bg-[#fedac2]/30",
                    isOverdue(lead) && "bg-red-50",
                    lead.status === 'converted' && "bg-green-50/50 opacity-75",
                    lead.status === 'lost' && "bg-gray-50 opacity-60"
                  )}
                  onClick={() => onLeadClick(lead)}
                >
                  {/* Name */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-[#fc5d01]">{lead.fullName}</span>
                      {lead.convertedStudentId && (
                        <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã convert
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-500" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-xs">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Source */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: getLeadStatusColor(lead.status) + '20',
                        borderColor: getLeadStatusColor(lead.status),
                        color: getLeadStatusColor(lead.status)
                      }}
                    >
                      {getLeadSourceLabel(lead.source)}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: getLeadStatusColor(lead.status) + '20',
                        color: getLeadStatusColor(lead.status),
                        borderColor: getLeadStatusColor(lead.status)
                      }}
                      className="border"
                    >
                      {getLeadStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>

                  {/* Assignee */}
                  <TableCell className="text-sm">
                    {getAssigneeName(lead.assignedTo)}
                  </TableCell>

                  {/* Study Info */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {lead.targetPTE && (
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-gray-500" />
                          <span>PTE {lead.targetPTE}</span>
                        </div>
                      )}
                      {lead.quotedFee && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{lead.quotedFee.toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Follow-up */}
                  <TableCell>
                    {lead.nextFollowUpAt ? (
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        isOverdue(lead) ? "text-red-600 font-medium" : "text-gray-600"
                      )}>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(lead.nextFollowUpAt), 'dd/MM/yyyy')}</span>
                        {isOverdue(lead) && <AlertTriangle className="h-3 w-3" />}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Chưa đặt</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLeadClick(lead)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(lead)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canConvert(lead) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onConvertClick(lead)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
