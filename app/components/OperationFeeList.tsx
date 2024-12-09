'use client';

import { useState } from 'react';
import { OperationFee, OperationFeeInput } from '../types/operation';
import TabNavigation from './TabNavigation';
import { doc, updateDoc, addDoc, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface OperationFeeListProps {
  operationFees: OperationFee[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  operationSort: 'asc' | 'desc';
  onSortChange: () => void;
  onExport: () => void;
  formatVND: (amount: number) => string;
  formatDate: (date: string) => string;
  activeTab: 'class' | '2345' | 'one-on-one';
  onTabChange: (tab: 'class' | '2345' | 'one-on-one') => void;
  currentDate: string;
  onUpdate: () => void;
}

export default function OperationFeeList({
  operationFees,
  searchTerm,
  onSearchChange,
  operationSort,
  onSortChange,
  onExport,
  formatVND,
  formatDate,
  activeTab,
  onTabChange,
  currentDate,
  onUpdate,
}: OperationFeeListProps) {
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [newFee, setNewFee] = useState<OperationFeeInput>({
    trainerName: '',
    amount: 0,
    date: currentDate,
    notes: '',
    type: 'class'
  });
  const [editForm, setEditForm] = useState<OperationFeeInput>({
    trainerName: '',
    amount: 0,
    date: currentDate,
    notes: '',
    type: 'class'
  });

  const handleAddFee = async () => {
    try {
      const feeData = {
        ...newFee,
        createdAt: serverTimestamp(),
        isProcess: false
      };

      await addDoc(collection(db, 'operationFees'), feeData);
      
      setNewFee({
        trainerName: '',
        amount: 0,
        date: currentDate,
        notes: '',
        type: activeTab
      });
      onUpdate(); // Trigger refetch after add
    } catch (error) {
      console.error('Error adding operation fee:', error);
    }
  };

  const handleEditFee = (fee: OperationFee) => {
    if (!fee.id) return;
    setEditingFee(fee.id);
    setEditForm({
      trainerName: fee.trainerName,
      amount: fee.amount,
      date: fee.date,
      notes: fee.notes,
      type: fee.type
    });
  };

  const handleUpdateFee = async () => {
    if (!editingFee) return;

    try {
      const feeRef = doc(db, 'operationFees', editingFee);
      await updateDoc(feeRef, editForm);
      setEditingFee(null);
      onUpdate(); // Trigger refetch after update
    } catch (error) {
      console.error('Error updating operation fee:', error);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this operation fee?')) return;

    try {
      await deleteDoc(doc(db, 'operationFees', id));
      onUpdate(); // Trigger refetch after delete
    } catch (error) {
      console.error('Error deleting operation fee:', error);
    }
  };

  const handleProcessToggle = async (fee: OperationFee) => {
    if (!fee.id || fee.type !== 'one-on-one') return;
    
    setProcessingId(fee.id);
    try {
      const feeRef = doc(db, 'operationFees', fee.id);
      await updateDoc(feeRef, {
        isProcess: !fee.isProcess
      });
      onUpdate(); // Trigger refetch after process status update
    } catch (error) {
      console.error('Error updating fee process status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Operation Fees</h2>
        <div className="flex gap-4">
          <button
            className="text-sm text-blue-600"
            onClick={onSortChange}
          >
            Sort by Date {operationSort === 'asc' ? '↑' : '↓'}
          </button>
          <input
            type="text"
            placeholder="Search operation fees..."
            className="border p-2 rounded w-64"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={onExport}
          >
            Export to Excel
          </button>
        </div>
      </div>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        type="operation"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Trainer Name"
          className="border p-2 rounded"
          value={newFee.trainerName}
          onChange={(e) => setNewFee({...newFee, trainerName: e.target.value})}
        />
        <input
          type="number"
          placeholder="Amount (VND)"
          className="border p-2 rounded"
          value={newFee.amount}
          onChange={(e) => setNewFee({...newFee, amount: Number(e.target.value)})}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={newFee.date}
          onChange={(e) => setNewFee({...newFee, date: e.target.value})}
        />
        <select
          className="border p-2 rounded"
          value={newFee.type}
          onChange={(e) => setNewFee({...newFee, type: e.target.value as 'class' | '2345' | 'one-on-one'})}
        >
          <option value="class">Class Fee</option>
          <option value="2345">2345 Fee</option>
          <option value="one-on-one">1-1 Fee</option>
        </select>
        <input
          type="text"
          placeholder="Notes"
          className="border p-2 rounded md:col-span-2"
          value={newFee.notes}
          onChange={(e) => setNewFee({...newFee, notes: e.target.value})}
        />
      </div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleAddFee}
      >
        Add Operation Fee
      </button>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Trainer Name</th>
              <th className="px-4 py-2 border">Amount</th>
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Notes</th>
              {activeTab === 'one-on-one' && (
                <th className="px-4 py-2 border">Process Status</th>
              )}
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {operationFees.map((fee) => (
              <tr 
                key={fee.id}
                className={
                  activeTab === 'one-on-one'
                    ? fee.isProcess
                      ? 'bg-green-50'
                      : 'bg-red-50'
                    : ''
                }
              >
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={editForm.trainerName}
                      onChange={(e) => setEditForm({...editForm, trainerName: e.target.value})}
                    />
                  ) : fee.trainerName}
                </td>
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <input
                      type="number"
                      className="w-full p-1 border rounded"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                    />
                  ) : formatVND(fee.amount)}
                </td>
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <input
                      type="date"
                      className="w-full p-1 border rounded"
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    />
                  ) : formatDate(fee.date)}
                </td>
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <select
                      className="w-full p-1 border rounded"
                      value={editForm.type}
                      onChange={(e) => setEditForm({...editForm, type: e.target.value as 'class' | '2345' | 'one-on-one'})}
                    >
                      <option value="class">Class Fee</option>
                      <option value="2345">2345 Fee</option>
                      <option value="one-on-one">1-1 Fee</option>
                    </select>
                  ) : fee.type === 'class' ? 'Class Fee' :
                     fee.type === '2345' ? '2345 Fee' :
                     fee.type === 'one-on-one' ? '1-1 Fee' : 'Class Fee'}
                </td>
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    />
                  ) : fee.notes}
                </td>
                {activeTab === 'one-on-one' && (
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => handleProcessToggle(fee)}
                      disabled={processingId === fee.id}
                      className={`px-3 py-1 rounded ${
                        fee.isProcess
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {processingId === fee.id ? 'Processing...' : (fee.isProcess ? 'Processed' : 'Not Processed')}
                    </button>
                  </td>
                )}
                <td className="px-4 py-2 border">
                  {editingFee === fee.id ? (
                    <div className="flex gap-2">
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={handleUpdateFee}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                        onClick={() => setEditingFee(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => fee.id && handleEditFee(fee)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => fee.id && handleDeleteFee(fee.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
