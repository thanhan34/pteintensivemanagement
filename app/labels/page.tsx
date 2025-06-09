'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Label, CreateLabelData } from '../types/task';
import { labelService } from '../utils/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label as UILabel } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Trash2,
  Tag,
  Palette
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const LABEL_COLORS = [
  '#fc5d01', // Orange primary
  '#fd7f33', // Orange rực
  '#ffac7b', // Orange sáng
  '#fdbc94', // Orange nhạt trung bình
  '#fedac2', // Orange nhạt rất nhẹ
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export default function LabelsPage() {
  const { data: session } = useSession();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateLabel, setShowCreateLabel] = useState(false);

  // Load labels
  useEffect(() => {
    const loadLabels = async () => {
      try {
        setLoading(true);
        const labelsData = await labelService.getLabels();
        setLabels(labelsData);
      } catch (error) {
        console.error('Error loading labels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      loadLabels();
    }
  }, [session]);

  // Filter labels based on search term
  const filteredLabels = labels.filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle label creation
  const handleLabelSaved = async () => {
    setShowCreateLabel(false);
    // Refresh labels
    const updatedLabels = await labelService.getLabels();
    setLabels(updatedLabels);
  };

  // Handle label deletion
  const handleDeleteLabel = async (labelId: string) => {
    if (confirm('Are you sure you want to delete this label? This action cannot be undone.')) {
      try {
        await labelService.deleteLabel(labelId);
        // Refresh labels
        const updatedLabels = await labelService.getLabels();
        setLabels(updatedLabels);
      } catch (error) {
        console.error('Error deleting label:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading labels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Label Management</h1>
          <p className="text-muted-foreground">Create and manage labels for your tasks</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateLabel} onOpenChange={setShowCreateLabel}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Label
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Label</DialogTitle>
                <DialogDescription>
                  Create a new label to organize your tasks
                </DialogDescription>
              </DialogHeader>
              <LabelForm 
                onSuccess={handleLabelSaved}
                onCancel={() => setShowCreateLabel(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labels.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Labels</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {labels.filter(l => l.createdBy === session?.user?.id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search labels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Labels Grid */}
      {filteredLabels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No labels found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first label to get started'}
              </p>
              <Button onClick={() => setShowCreateLabel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Label
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLabels.map((label) => (
            <LabelCard
              key={label.id}
              label={label}
              onDelete={handleDeleteLabel}
              currentUserId={session?.user?.id || ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Label Card Component
interface LabelCardProps {
  label: Label;
  onDelete: (labelId: string) => void;
  currentUserId: string;
}

function LabelCard({ label, onDelete, currentUserId }: LabelCardProps) {
  const isOwner = label.createdBy === currentUserId;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: label.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">{label.name}</h3>
              <p className="text-xs text-muted-foreground">
                Created {format(label.createdAt, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(label.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Label Form Component
interface LabelFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function LabelForm({ onSuccess, onCancel }: LabelFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLabelData>({
    name: '',
    color: LABEL_COLORS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      await labelService.createLabel(formData, session.user.id);
      onSuccess();
    } catch (error) {
      console.error('Error creating label:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Label Name */}
      <div className="space-y-2">
        <UILabel htmlFor="name">Label Name *</UILabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter label name..."
          required
        />
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <UILabel>Label Color</UILabel>
        <div className="flex flex-wrap gap-2">
          {LABEL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                formData.color === color ? "border-gray-400 scale-110" : "border-gray-200 hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <UILabel>Preview</UILabel>
        <div className="p-3 border rounded-md bg-muted/50">
          <Badge
            variant="secondary"
            style={{ 
              backgroundColor: formData.color + '20', 
              color: formData.color,
              borderColor: formData.color + '40'
            }}
          >
            <Tag className="h-3 w-3 mr-1" />
            {formData.name || 'Label name'}
          </Badge>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? 'Creating...' : 'Create Label'}
        </Button>
      </div>
    </form>
  );
}
