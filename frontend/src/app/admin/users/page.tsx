'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchUsersAndRoles = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const [usersRes, rolesRes] = await Promise.all([
        fetch('http://localhost:1337/api/users?populate=role', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch('http://localhost:1337/api/users-permissions/roles', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data || []);
      }
      
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const columns: ColumnDef<any>[] = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => (
      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
        {row.role?.name || 'None'}
      </span>
    )},
    { key: 'confirmed', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs ${row.blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {row.blocked ? 'Blocked' : 'Active'}
      </span>
    )}
  ];

  const fields: FormField[] = [
    { key: 'username', label: 'Username', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'select', options: roles.map(r => ({ value: r.id, label: r.name })) },
    { key: 'blocked', label: 'Blocked (prevent login)', type: 'boolean' }
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.id;
    
    // For users API in Strapi, it's typically /api/users/:id and expects flat payload, not wrapped in `data`
    const payload = {
      username: formData.username,
      email: formData.email,
      role: formData.role ? Number(formData.role) : undefined,
      blocked: !!formData.blocked
    };

    if (!isEditing) {
      // Create user needs a password
      (payload as any).password = 'ChangeMe123!';
      (payload as any).confirmed = true;
    }

    const url = isEditing 
      ? `http://localhost:1337/api/users/${editingData.id}`
      : `http://localhost:1337/api/users`;
      
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const resData = await res.json();
      throw new Error(resData.error?.message || 'Failed to save user');
    }

    fetchUsersAndRoles();
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete user "${row.username}"?`)) return;
    
    const jwt = localStorage.getItem('jwt');
    await fetch(`http://localhost:1337/api/users/${row.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    fetchUsersAndRoles();
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Users</h1>
        <p className="text-gray-400">View registered users, change roles, or block accounts.</p>
      </div>

      <DataTable 
        title="Users"
        columns={columns}
        data={users}
        onAdd={() => { setEditingData({}); setIsModalOpen(true); }}
        onEdit={(row) => { 
          setEditingData({ ...row, role: row.role?.id }); 
          setIsModalOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New User"
      />

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingData?.id ? 'Edit User' : 'Create User'}
        fields={fields}
        initialData={editingData}
      />
    </div>
  );
}
