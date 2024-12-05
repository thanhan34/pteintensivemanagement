import { useState, useEffect } from 'react';
import { Student, StudentFormData } from '../types/student';

interface StudentFormProps {
  onSubmit: (formData: StudentFormData) => Promise<void>;
  initialData?: Student;
}

export default function StudentForm({ onSubmit, initialData }: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    targetScore: 30,
    startDate: new Date().toISOString().split('T')[0],
    studyDuration: 1,
    tuitionPaymentDates: [],
    tuitionPaymentStatus: 'pending',
    trainerName: '',
    tuitionFee: 6500000,
    notes: ''
  });

  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        targetScore: initialData.targetScore,
        startDate: initialData.startDate,
        studyDuration: initialData.studyDuration,
        tuitionPaymentDates: initialData.tuitionPaymentDates,
        tuitionPaymentStatus: initialData.tuitionPaymentStatus,
        trainerName: initialData.trainerName,
        tuitionFee: initialData.tuitionFee,
        notes: initialData.notes
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure there's at least one payment date
      const submissionData = {
        ...formData,
        tuitionPaymentDates: formData.tuitionPaymentDates.length > 0 
          ? formData.tuitionPaymentDates 
          : [formData.startDate]
      };
      
      await onSubmit(submissionData);
      
      if (!initialData) {
        // Only reset form if this is a new student (not editing)
        setFormData({
          name: '',
          targetScore: 30,
          startDate: new Date().toISOString().split('T')[0],
          studyDuration: 1,
          tuitionPaymentDates: [],
          tuitionPaymentStatus: 'pending',
          trainerName: '',
          tuitionFee: 6500000,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error handling student:', error);
    }
  };

  const addPaymentDate = () => {
    if (!formData.tuitionPaymentDates.includes(newPaymentDate)) {
      setFormData({
        ...formData,
        tuitionPaymentDates: [...formData.tuitionPaymentDates, newPaymentDate].sort()
      });
    }
  };

  const removePaymentDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      tuitionPaymentDates: formData.tuitionPaymentDates.filter(date => date !== dateToRemove)
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          required
        />
      </div>

      <div>
  <label className="block text-sm font-medium text-gray-700">Target Score</label>
  <select
    value={formData.targetScore}
    onChange={(e) =>
      setFormData({ ...formData, targetScore: Number(e.target.value) })
    }
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
    required
  >
    <option value="" disabled>Select Target Score</option>
    <option value={30}>30</option>
    <option value={36}>36</option>
    <option value={42}>42</option>
    <option value={50}>50</option>
    <option value={58}>58</option>
    <option value={65}>65</option>
    <option value={79}>79</option>
  </select>
</div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring focus:ring-[#fc5d01] focus:ring-offset-0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Study Duration (months)</label>
        <input
          type="number"
          value={formData.studyDuration}
          onChange={(e) => setFormData({...formData, studyDuration: Number(e.target.value)})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          required
          min="1"
        />
      </div>

      <div>
  <label className="block text-sm font-medium text-gray-700">Trainer Name</label>
  <select
    value={formData.trainerName}
    onChange={(e) =>
      setFormData({ ...formData, trainerName: e.target.value })
    }
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
    required
  >
    <option value="" disabled>Select Trainer</option>
    <option value="Thanh An">Thanh An</option>
    <option value="Hải Hà">Hải Hà</option>
    <option value="Phương Tuyết">Phương Tuyết</option>
    <option value="Bích Diệp">Bích Diệp</option>
    <option value="Thanh Tâm">Thanh Tâm</option>
    <option value="Thu Hương">Thu Hương</option>
    <option value="Thanh Hương">Thanh Hương</option>
    <option value="Bạch Yến">Bạch Yến</option>
    <option value="Dung Nguyễn">Dung Nguyễn</option>
  </select>
</div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tuition Fee (VND)</label>
        <input
          type="number"
          value={formData.tuitionFee}
          onChange={(e) => setFormData({...formData, tuitionFee: Number(e.target.value)})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          required
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
        <select
          value={formData.tuitionPaymentStatus}
          onChange={(e) => setFormData({...formData, tuitionPaymentStatus: e.target.value as StudentFormData['tuitionPaymentStatus']})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          required
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Dates</label>
        <div className="mt-1 flex gap-2">
          <input
            type="date"
            value={newPaymentDate}
            onChange={(e) => setNewPaymentDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          />
          <button
            type="button"
            onClick={addPaymentDate}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#fc5d01] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
          >
            Add Date
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {formData.tuitionPaymentDates.map((date) => (
            <div key={date} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
              <span>{formatDate(date)}</span>
              <button
                type="button"
                onClick={() => removePaymentDate(date)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01]"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#fc5d01] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
      >
        {initialData ? 'Update Student' : 'Add Student'}
      </button>
    </form>
  );
}
