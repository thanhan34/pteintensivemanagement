'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
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
    defaultFromDate: new Date().toISOString().split('T')[0],
    defaultToDate: new Date().toISOString().split('T')[0],
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as Settings);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
