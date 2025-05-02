'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UsefulLink } from '../types/links';

export default function UsefulLinksManager() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<UsefulLink, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    url: '',
    description: '',
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'usefulLinks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedLinks: UsefulLink[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLinks.push({ id: doc.id, ...doc.data() } as UsefulLink);
      });
      setLinks(fetchedLinks);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
    });
    setIsAddingLink(false);
    setIsEditingLink(null);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      const newLink: Omit<UsefulLink, 'id'> = {
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      
      await addDoc(collection(db, 'usefulLinks'), newLink);
      resetForm();
      fetchLinks();
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const handleEditLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingLink) return;
    
    try {
      const now = new Date().toISOString();
      const updatedLink = {
        ...formData,
        updatedAt: now,
      };
      
      await updateDoc(doc(db, 'usefulLinks', isEditingLink), updatedLink);
      resetForm();
      fetchLinks();
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await deleteDoc(doc(db, 'usefulLinks', id));
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const startEditing = (link: UsefulLink) => {
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
    });
    setIsEditingLink(link.id);
    setIsAddingLink(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Useful Links</h2>
        {!isAddingLink && !isEditingLink && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#fc5d01] hover:bg-[#db5101] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
          >
            Add New Link
          </button>
        )}
      </div>

      {(isAddingLink || isEditingLink) && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            {isAddingLink ? 'Add New Link' : 'Edit Link'}
          </h3>
          <form onSubmit={isAddingLink ? handleAddLink : handleEditLink} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                type="url"
                name="url"
                id="url"
                required
                value={formData.url}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] sm:text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#fc5d01] hover:bg-[#db5101] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01]"
              >
                {isAddingLink ? 'Add Link' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {links.length === 0 ? (
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">No useful links added yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {links.map((link) => (
              <li key={link.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-[#fc5d01] truncate">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link.title}
                      </a>
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 break-all">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link.url}
                      </a>
                    </p>
                    {link.description && (
                      <p className="mt-2 text-sm text-gray-700">{link.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Added: {new Date(link.createdAt).toLocaleDateString()}
                      {link.updatedAt !== link.createdAt && 
                        ` • Updated: ${new Date(link.updatedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => startEditing(link)}
                      className="text-sm font-medium text-[#fc5d01] hover:text-[#db5101]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
