'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Lead, LeadFormData, LeadStatus } from '../types/lead';
import { User } from '../types/roles';
import { 
  getAllLeads, 
  getLeadsByAssignee, 
  createLead, 
  updateLead, 
  updateLeadStatus,
  getAllSalers
} from '../utils/leadService';
import { convertLeadToStudent, canConvertLead } from '../utils/leadConverter';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import LeadKanbanBoard from '../components/LeadKanbanBoard';
import LeadTableView from '../components/LeadTableView';
import LeadForm from '../components/LeadForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Phone, Mail, Calendar, DollarSign, Target, Users, CheckCircle2, LayoutGrid, Table, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { deleteLead } from '../utils/leadService';

export default function LeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [converting, setConverting] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const isAdmin = userRole === 'admin';
  const isSaler = userRole === 'saler';

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!isAdmin && !isSaler) {
      setLoading(false);
      return;
    }

    try {
      let leadsData: Lead[];
      
      if (isAdmin) {
        leadsData = await getAllLeads();
      } else if (isSaler && userId) {
        leadsData = await getLeadsByAssignee(userId);
      } else {
        leadsData = [];
      }

      setLeads(leadsData);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isSaler, userId]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLeads();
      fetchUsers();
    }
  }, [status, fetchLeads, fetchUsers]);

  const handleAddLead = async (formData: LeadFormData) => {
    if (!userId || (!isAdmin && !isSaler)) return;

    try {
      await createLead(formData, userId, session?.user?.name || 'Unknown');
      setShowForm(false);
      await fetchLeads();
      alert('Lead đã được tạo thành công!');
    } catch (err) {
      console.error('Error creating lead:', err);
      alert('Lỗi khi tạo lead');
    }
  };

  const handleUpdateLead = async (formData: LeadFormData) => {
    if (!selectedLead) return;

    try {
      await updateLead(selectedLead.id, formData);
      setShowForm(false);
      setSelectedLead(null);
      await fetchLeads();
      alert('Lead đã được cập nhật!');
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Lỗi khi cập nhật lead');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      await fetchLeads();
    } catch (err) {
      console.error('Error updating lead status:', err);
      alert('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  const handleEditLead = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
    }
    setShowLeadDetail(false);
    setShowForm(true);
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;

    // Check if can convert
    const { canConvert, reason } = await canConvertLead(selectedLead.id);
    if (!canConvert) {
      alert(reason || 'Không thể convert lead này');
      return;
    }

    const confirm = window.confirm(
      `Bạn có chắc chắn muốn convert lead "${selectedLead.fullName}" thành Student?\n\n` +
      `Sau khi convert:\n` +
      `- Lead sẽ chuyển sang trạng thái "Converted"\n` +
      `- Một Student mới sẽ được tạo\n` +
      `- Bạn sẽ được chuyển đến trang Students để hoàn thiện thông tin`
    );

    if (!confirm) return;

    setConverting(true);
    try {
      const studentId = await convertLeadToStudent(selectedLead.id);
      alert('✅ Convert thành công! Đang chuyển đến trang Students...');
      setShowLeadDetail(false);
      setSelectedLead(null);
      await fetchLeads();
      
      // Redirect to students page
      router.push('/students');
    } catch (err) {
      console.error('Error converting lead:', err);
      alert('Lỗi khi convert lead: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead || !isAdmin) return;

    const confirm = window.confirm(
      `⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA LEAD NÀY?\n\n` +
      `Lead: ${selectedLead.fullName}\n` +
      `Phone: ${selectedLead.phone}\n\n` +
      `Hành động này KHÔNG THỂ HOÀN TÁC!`
    );

    if (!confirm) return;

    try {
      await deleteLead(selectedLead.id);
      alert('✅ Đã xóa lead thành công!');
      setShowLeadDetail(false);
      setSelectedLead(null);
      await fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Lỗi khi xóa lead: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl text-[#fc5d01]">Đang tải...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl text-red-500">Vui lòng đăng nhập để truy cập trang này</div>
      </div>
    );
  }

  if (!isAdmin && !isSaler) {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl text-red-500">Bạn không có quyền truy cập trang này</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#fc5d01]">Quản Lý Leads</h1>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Tất cả leads' : 'Leads được phân công cho bạn'}
              </p>
            </div>
            <div className="flex gap-3">
              {/* View Toggle */}
              <div className="flex items-center border border-[#fc5d01]/30 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={viewMode === 'kanban' ? 'bg-[#fc5d01] hover:bg-[#fd7f33]' : ''}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-[#fc5d01] hover:bg-[#fd7f33]' : ''}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </div>
              <Button
                onClick={() => {
                  setSelectedLead(null);
                  setShowForm(true);
                }}
                className="bg-[#fc5d01] hover:bg-[#fd7f33] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm Lead Mới
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#fc5d01]">{leads.length}</div>
                <div className="text-sm text-gray-600">Tổng Leads</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {leads.filter(l => ['lead_new', 'consulted', 'interested'].includes(l.status)).length}
                </div>
                <div className="text-sm text-gray-600">Đang Tư Vấn</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {leads.filter(l => l.status === 'paid').length}
                </div>
                <div className="text-sm text-gray-600">Đã Thanh Toán</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">
                  {leads.filter(l => l.status === 'converted').length}
                </div>
                <div className="text-sm text-gray-600">Đã Convert</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Content */}
        {error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-red-500 text-center">{error}</p>
              <Button onClick={fetchLeads} className="mt-4">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'kanban' ? (
          <LeadKanbanBoard
            leads={leads}
            users={users}
            onStatusChange={handleStatusChange}
            onLeadClick={handleLeadClick}
          />
        ) : (
          <LeadTableView
            leads={leads}
            users={users}
            onLeadClick={handleLeadClick}
            onEditClick={(lead) => {
              setSelectedLead(lead);
              setShowForm(true);
            }}
            onConvertClick={async (lead) => {
              setSelectedLead(lead);
              await handleConvertLead();
            }}
          />
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#fc5d01]">
                {selectedLead ? 'Chỉnh Sửa Lead' : 'Thêm Lead Mới'}
              </DialogTitle>
            </DialogHeader>
            <LeadForm
              onSubmit={selectedLead ? handleUpdateLead : handleAddLead}
              initialData={selectedLead || undefined}
              mode={selectedLead ? 'edit' : 'create'}
            />
          </DialogContent>
        </Dialog>

        {/* Lead Detail Dialog */}
        <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#fc5d01]">Chi Tiết Lead</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#fc5d01]">{selectedLead.fullName}</h2>
                    <Badge
                      className="mt-2"
                      style={{
                        backgroundColor: `${selectedLead.status === 'paid' ? '#22c55e' : '#fc5d01'}20`,
                        color: selectedLead.status === 'paid' ? '#22c55e' : '#fc5d01'
                      }}
                    >
                      {selectedLead.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {selectedLead.status === 'paid' && !selectedLead.convertedStudentId && (
                      <Button
                        onClick={handleConvertLead}
                        disabled={converting}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {converting ? 'Đang Convert...' : 'Convert → Student'}
                      </Button>
                    )}
                    <Button onClick={() => handleEditLead()} variant="outline">
                      Chỉnh Sửa
                    </Button>
                    {isAdmin && (
                      <Button
                        onClick={handleDeleteLead}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Thông Tin Liên Hệ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.facebook && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📘</span>
                        <span>{selectedLead.facebook}</span>
                      </div>
                    )}
                    {selectedLead.zalo && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">💬</span>
                        <span>{selectedLead.zalo}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Study Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Thông Tin Học Tập</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedLead.targetPTE && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span>Target PTE: {selectedLead.targetPTE}</span>
                      </div>
                    )}
                    {selectedLead.suggestedCourseName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📚</span>
                        <span>Khóa học: {selectedLead.suggestedCourseName}</span>
                      </div>
                    )}
                    {selectedLead.quotedFee && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>{selectedLead.quotedFee.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                    {selectedLead.visaPurpose && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">🎯</span>
                        <span>Mục đích: {selectedLead.visaPurpose}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Assignment & Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Phân Công & Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>Tư vấn viên: {users.find(u => u.id === selectedLead.assignedTo)?.name || 'N/A'}</span>
                    </div>
                    {selectedLead.nextFollowUpAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Follow-up: {format(new Date(selectedLead.nextFollowUpAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📅</span>
                      <span>Tạo: {format(new Date(selectedLead.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {selectedLead.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Ghi Chú</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLead.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
