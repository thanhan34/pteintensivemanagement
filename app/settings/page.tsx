'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import SettingsForm from '../components/SettingsForm';
import { Settings } from '../types/settings';

const defaultSettings: Settings = {
  accounting: {
    defaultFromDate: new Date().toISOString().split('T')[0],    
  },
  attendance: {
    defaultFromDate: new Date().toISOString().split('T')[0],
    defaultToDate: new Date().toISOString().split('T')[0],
  },
  students: {
    trainerOptions: [],
  },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      redirect('/');
    }

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as Settings);
        } else {
          // Initialize with default settings if none exist
          await setDoc(doc(db, 'settings', 'global'), defaultSettings);
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session, status]);

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff5ef] py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage global settings for accounting, attendance, and student management.
            </p>
          </div>
          <SettingsForm 
            initialSettings={settings} 
            onSave={handleSaveSettings}
          />
        </div>
      </div>
    </div>
  );
}
