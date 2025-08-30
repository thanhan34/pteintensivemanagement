'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserRole } from '../types/roles';

export default function UserRoleManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainer');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(userData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    setEditingUserId(userId);
    setSelectedRole(role);
  };

  const saveRoleChange = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: selectedRole,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: selectedRole } : user
      ));
      
      setEditingUserId(null);
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        
        // Update local state
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully');
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'administrative_assistant':
        return 'Administrative Assistant';
      case 'accountance':
        return 'Accountance';
      case 'trainer':
        return 'Trainer';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-[#fc5d01] text-white';
      case 'administrative_assistant':
        return 'bg-[#ffac7b] text-[#fc5d01]';
      case 'accountance':
        return 'bg-[#fdbc94] text-[#fc5d01]';
      case 'trainer':
        return 'bg-[#fedac2] text-[#fc5d01]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-[#fc5d01]">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-red-500 text-center">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-[#fff5ef] border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-medium text-[#fc5d01]">User Permissions</h3>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#fc5d01] flex items-center justify-center text-white">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUserId === user.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#fc5d01] focus:border-[#fc5d01] sm:text-sm rounded-md"
                      >
                        <option value="trainer">Trainer</option>
                        <option value="administrative_assistant">Administrative Assistant</option>
                        <option value="accountance">Accountance</option>
                        <option value="admin">Administrator</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingUserId === user.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveRoleChange(user.id)}
                          className="text-[#fc5d01] hover:text-[#fd7f33]"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          className="text-[#fc5d01] hover:text-[#fd7f33]"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name || 'this user')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && !error && !loading && (
        <div className="p-8 text-center text-gray-500">
          No users found in the system.
        </div>
      )}
    </div>
  );
}
