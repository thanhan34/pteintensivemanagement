'use client';

import { useState, useEffect } from 'react';
import { Lead, LeadFormData, LeadSource, LeadStatus } from '../types/lead';
import { User } from '../types/roles';
import { getAllSalers } from '../utils/leadService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadFormProps {
  onSubmit: (formData: LeadFormData) => void;
  initialData?: Lead;
  mode?: 'create' | 'edit';
}

export default function LeadForm({ onSubmit, initialData, mode = 'create' }: LeadFormProps) {
  const [salers, setSalers] = useState<User[]>([]);
  const [loadingSalers, setLoadingSalers] = useState(true);
  const [useAutoAssign, setUseAutoAssign] = useState(false);

  const [formData, setFormData] = useState<LeadFormData>({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    facebook: initialData?.facebook || '',
    zalo: initialData?.zalo || '',
    source: initialData?.source || 'facebook',
    status: initialData?.status || 'lead_new',
    assignedTo: initialData?.assignedTo || '',
    assignedBy: initialData?.assignedBy || '',
    assignmentType: initialData?.assignmentType || 'manual',
    lastContactAt: initialData?.lastContactAt || '',
    nextFollowUpAt: initialData?.nextFollowUpAt || '',
    targetPTE: initialData?.targetPTE || undefined,
    visaPurpose: initialData?.visaPurpose || '',
    expectedTimeline: initialData?.expectedTimeline || '',
    suggestedCourseName: initialData?.suggestedCourseName || '',
    quotedFee: initialData?.quotedFee || undefined,
    notes: initialData?.notes || ''
  });

  useEffect(() => {
    fetchSalers();
  }, []);

  const fetchSalers = async () => {
    try {
      const salersList = await getAllSalers();
      setSalers(salersList);
    } catch (error) {
      console.error('Error fetching salers:', error);
    } finally {
      setLoadingSalers(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.fullName || !formData.phone) {
      alert('Vui lòng điền tên và số điện thoại');
      return;
    }

    // Set assignment type
    const finalData: LeadFormData = {
      ...formData,
      assignmentType: useAutoAssign ? 'auto' : 'manual'
    };

    onSubmit(finalData);
  };

  const handleAutoAssignToggle = () => {
    setUseAutoAssign(!useAutoAssign);
    if (!useAutoAssign) {
      setFormData({ ...formData, assignedTo: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card className="border-[#fc5d01]/20">
        <CardHeader className="bg-[#fedac2]">
          <CardTitle className="text-[#fc5d01]">Thông Tin Cơ Bản</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName" className="text-[#fc5d01]">
                Họ và Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                required
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-[#fc5d01]">
                Số Điện Thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                required
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-[#fc5d01]">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="source" className="text-[#fc5d01]">
                Nguồn <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.source}
                onValueChange={(value: LeadSource) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger className="border-[#fc5d01]/30 focus:border-[#fc5d01]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="zalo">Zalo</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Giới Thiệu</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="facebook" className="text-[#fc5d01]">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="facebook.com/user"
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="zalo" className="text-[#fc5d01]">Zalo</Label>
              <Input
                id="zalo"
                value={formData.zalo}
                onChange={(e) => setFormData({ ...formData, zalo: e.target.value })}
                placeholder="Zalo ID"
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Study Info */}
      <Card className="border-[#fc5d01]/20">
        <CardHeader className="bg-[#fedac2]">
          <CardTitle className="text-[#fc5d01]">Thông Tin Học Tập</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetPTE" className="text-[#fc5d01]">Target PTE</Label>
              <Input
                id="targetPTE"
                type="number"
                value={formData.targetPTE || ''}
                onChange={(e) => setFormData({ ...formData, targetPTE: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="79"
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="visaPurpose" className="text-[#fc5d01]">Mục Đích Visa</Label>
              <Input
                id="visaPurpose"
                value={formData.visaPurpose}
                onChange={(e) => setFormData({ ...formData, visaPurpose: e.target.value })}
                placeholder="Úc, Canada, UK..."
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="expectedTimeline" className="text-[#fc5d01]">Timeline Dự Kiến</Label>
              <Input
                id="expectedTimeline"
                value={formData.expectedTimeline}
                onChange={(e) => setFormData({ ...formData, expectedTimeline: e.target.value })}
                placeholder="3 tháng, 6 tháng..."
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="suggestedCourseName" className="text-[#fc5d01]">Khóa Học Đề Xuất</Label>
              <Input
                id="suggestedCourseName"
                value={formData.suggestedCourseName}
                onChange={(e) => setFormData({ ...formData, suggestedCourseName: e.target.value })}
                placeholder="Intensive 1-1, Group..."
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>

            <div>
              <Label htmlFor="quotedFee" className="text-[#fc5d01]">Học Phí Báo Giá (VNĐ)</Label>
              <Input
                id="quotedFee"
                type="number"
                value={formData.quotedFee || ''}
                onChange={(e) => setFormData({ ...formData, quotedFee: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="15000000"
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Status */}
      <Card className="border-[#fc5d01]/20">
        <CardHeader className="bg-[#fedac2]">
          <CardTitle className="text-[#fc5d01]">Phân Công & Trạng Thái</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-[#fc5d01]">Trạng Thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LeadStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="border-[#fc5d01]/30 focus:border-[#fc5d01]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_new">Lead Mới</SelectItem>
                  <SelectItem value="consulted">Đã Tư Vấn</SelectItem>
                  <SelectItem value="interested">Quan Tâm</SelectItem>
                  <SelectItem value="closed">Đóng Deal</SelectItem>
                  <SelectItem value="paid">Đã Thanh Toán</SelectItem>
                  <SelectItem value="lost">Mất Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedTo" className="text-[#fc5d01]">
                Tư Vấn Viên <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  disabled={useAutoAssign || loadingSalers}
                >
                  <SelectTrigger className="border-[#fc5d01]/30 focus:border-[#fc5d01]">
                    <SelectValue placeholder={loadingSalers ? "Đang tải..." : useAutoAssign ? "Tự động phân công" : "Chọn tư vấn viên"} />
                  </SelectTrigger>
                  <SelectContent>
                    {salers.map((saler) => (
                      <SelectItem key={saler.id} value={saler.id}>
                        {saler.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant={useAutoAssign ? "default" : "outline"}
                  onClick={handleAutoAssignToggle}
                  className={useAutoAssign ? "bg-[#fc5d01] hover:bg-[#fd7f33]" : "border-[#fc5d01] text-[#fc5d01] hover:bg-[#fedac2]"}
                >
                  {useAutoAssign ? "✓ Auto" : "Auto"}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="nextFollowUpAt" className="text-[#fc5d01]">Ngày Follow-up Tiếp Theo</Label>
              <Input
                id="nextFollowUpAt"
                type="datetime-local"
                value={formData.nextFollowUpAt}
                onChange={(e) => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-[#fc5d01]/20">
        <CardHeader className="bg-[#fedac2]">
          <CardTitle className="text-[#fc5d01]">Ghi Chú</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ghi chú về lead..."
            rows={4}
            className="border-[#fc5d01]/30 focus:border-[#fc5d01]"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          className="bg-[#fc5d01] hover:bg-[#fd7f33] text-white px-8"
        >
          {mode === 'create' ? 'Tạo Lead' : 'Cập Nhật'}
        </Button>
      </div>
    </form>
  );
}
