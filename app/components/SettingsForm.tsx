'use client';

import { useState } from 'react';
import { Settings } from '../types/settings';

interface SettingsFormProps {
  initialSettings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}

export default function SettingsForm({ initialSettings, onSave }: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(settings);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainerOptionChange = (value: string) => {
    const options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
    setSettings(prev => ({
      ...prev,
      students: {
        ...prev.students,
        trainerOptions: options
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Accounting Settings</h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="accounting-from" className="block text-sm font-medium text-gray-700">
                Default From Date
              </label>
              <input
                type="date"
                id="accounting-from"
                value={settings.accounting.defaultFromDate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  accounting: { ...prev.accounting, defaultFromDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>            
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Attendance Settings</h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="attendance-from" className="block text-sm font-medium text-gray-700">
                Default From Date
              </label>
              <input
                type="date"
                id="attendance-from"
                value={settings.attendance.defaultFromDate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  attendance: { ...prev.attendance, defaultFromDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="attendance-to" className="block text-sm font-medium text-gray-700">
                Default To Date
              </label>
              <input
                type="date"
                id="attendance-to"
                value={settings.attendance.defaultToDate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  attendance: { ...prev.attendance, defaultToDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Students Settings</h3>
          <div className="mt-6">
            <label htmlFor="trainer-options" className="block text-sm font-medium text-gray-700">
              Trainer Options (comma-separated)
            </label>
            <textarea
              id="trainer-options"
              rows={3}
              value={settings.students.trainerOptions.join(', ')}
              onChange={(e) => handleTrainerOptionChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              placeholder="Enter trainer options separated by commas"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label htmlFor="students-from" className="block text-sm font-medium text-gray-700">
                Default From Date
              </label>
              <input
                type="date"
                id="students-from"
                value={settings.students.defaultFromDate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  students: { ...prev.students, defaultFromDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="students-to" className="block text-sm font-medium text-gray-700">
                Default To Date
              </label>
              <input
                type="date"
                id="students-to"
                value={settings.students.defaultToDate}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  students: { ...prev.students, defaultToDate: e.target.value }
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#db5101] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
