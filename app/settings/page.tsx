'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
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
    defaultFromDate: new Date().toISOString().split('T')[0],
    defaultToDate: new Date().toISOString().split('T')[0],
  },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState<string | null>(null);
  const [teamWebhooks, setTeamWebhooks] = useState<Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
    discordWebhookUrl?: string;
  }>>([]);
  const [savingTeamWebhooks, setSavingTeamWebhooks] = useState(false);
  const [teamWebhookMessage, setTeamWebhookMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/');
    }

    const fetchSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', session.user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data() as { discordWebhookUrl?: string };
          setDiscordWebhookUrl(userData.discordWebhookUrl || '');
        }

        if (session.user?.role === 'admin') {
          const usersSnapshot = await getDocs(query(collection(db, 'users')));
          const users = usersSnapshot.docs.map((userDoc) => {
            const data = userDoc.data() as {
              name?: string;
              email?: string;
              role?: string;
              discordWebhookUrl?: string;
            };

            return {
              id: userDoc.id,
              name: data.name,
              email: data.email,
              role: data.role,
              discordWebhookUrl: data.discordWebhookUrl || ''
            };
          });
          setTeamWebhooks(users);

          const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
          if (settingsDoc.exists()) {
            setSettings(settingsDoc.data() as Settings);
          } else {
            // Initialize with default settings if none exist
            await setDoc(doc(db, 'settings', 'global'), defaultSettings);
            setSettings(defaultSettings);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session, status]);

  const handleSaveWebhook = async () => {
    if (!session?.user?.id) return;

    setSavingWebhook(true);
    setWebhookMessage(null);
    try {
      await setDoc(
        doc(db, 'users', session.user.id),
        {
          discordWebhookUrl: discordWebhookUrl.trim(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      setWebhookMessage('Saved Discord webhook successfully');
    } catch (error) {
      console.error('Error saving webhook:', error);
      setWebhookMessage('Failed to save Discord webhook');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTeamWebhookChange = (userId: string, value: string) => {
    setTeamWebhooks((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, discordWebhookUrl: value } : user))
    );
  };

  const handleSaveTeamWebhooks = async () => {
    setSavingTeamWebhooks(true);
    setTeamWebhookMessage(null);
    try {
      await Promise.all(
        teamWebhooks.map((user) =>
          setDoc(
            doc(db, 'users', user.id),
            {
              discordWebhookUrl: (user.discordWebhookUrl || '').trim(),
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          )
        )
      );

      setTeamWebhookMessage('Saved all team webhooks successfully');
    } catch (error) {
      console.error('Error saving team webhooks:', error);
      setTeamWebhookMessage('Failed to save team webhooks');
    } finally {
      setSavingTeamWebhooks(false);
    }
  };

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
              Manage personal webhook and system settings.
            </p>
          </div>

          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Discord Webhook</h3>
              <p className="mt-1 text-sm text-gray-500">
                Webhook này được dùng khi bạn bấm nút nộp báo cáo cuối ngày ở trang Tasks.
              </p>

              <div className="mt-4">
                <label htmlFor="discord-webhook" className="block text-sm font-medium text-gray-700">
                  Discord Webhook URL
                </label>
                <input
                  id="discord-webhook"
                  type="url"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  disabled={savingWebhook}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#db5101] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01] disabled:opacity-60"
                >
                  {savingWebhook ? 'Saving...' : 'Save Webhook'}
                </button>
                {webhookMessage && <span className="text-sm text-gray-600">{webhookMessage}</span>}
              </div>
            </div>
          </div>

          {session?.user?.role === 'admin' && (
            <>
              <div className="bg-white shadow sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Team Discord Webhooks</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Mỗi nhân viên có 1 webhook riêng. Khi có nhân viên mới, thêm webhook tại đây.
                  </p>

                  <div className="mt-4 space-y-3">
                    {teamWebhooks.length === 0 ? (
                      <p className="text-sm text-gray-500">No users found.</p>
                    ) : (
                      teamWebhooks.map((user) => (
                        <div key={user.id} className="border rounded-md p-3">
                          <div className="mb-2 text-sm text-gray-700">
                            <span className="font-medium">{user.name || user.email || user.id}</span>
                            {user.role && <span className="ml-2 text-xs text-gray-500">({user.role})</span>}
                          </div>
                          <input
                            type="url"
                            value={user.discordWebhookUrl || ''}
                            onChange={(e) => handleTeamWebhookChange(user.id, e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
                          />
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveTeamWebhooks}
                      disabled={savingTeamWebhooks}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#db5101] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01] disabled:opacity-60"
                    >
                      {savingTeamWebhooks ? 'Saving...' : 'Save All Team Webhooks'}
                    </button>
                    {teamWebhookMessage && <span className="text-sm text-gray-600">{teamWebhookMessage}</span>}
                  </div>
                </div>
              </div>

              <SettingsForm
                initialSettings={settings}
                onSave={handleSaveSettings}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
