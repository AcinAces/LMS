'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';
import { useToast } from '@/context/ToastContext';
import { checkPasswordRequirements } from '@/utils/password';

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchUsersAndRoles = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users?populate=role`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users-permissions/roles`, {
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
    { 
      key: 'username', 
      label: 'Username', 
      type: 'text', 
      required: true,
      placeholder: 'e.g. john_doe',
      minLength: 3,
      maxLength: 30,
      pattern: '^[a-zA-Z0-9_.-]{3,30}$',
      hint: 'Alphanumeric, dots, dashes and underscores only (3–30 characters, no spaces)'
    },
    { 
      key: 'email', 
      label: 'Email Address', 
      type: 'email', 
      required: true,
      placeholder: 'name@example.com',
      hint: 'Valid email address format (e.g. user@domain.com)'
    },
    ...(editingData?.id ? [{
      key: 'password', 
      label: 'New Password (Optional)', 
      type: 'password' as const, 
      required: false,
      placeholder: 'Leave blank to keep existing password',
      minLength: 12,
      hint: 'If changing, must be min. 12 chars with uppercase, lowercase, and a sign/symbol'
    }] : [{ 
      key: 'password', 
      label: 'Password', 
      type: 'password' as const, 
      required: true,
      placeholder: '••••••••••••',
      minLength: 12,
      hint: 'Min. 12 characters, 1 uppercase, 1 lowercase, 1 sign/symbol (!@#$...)'
    }]),
    { 
      key: 'role', 
      label: 'User Role', 
      type: 'select', 
      required: true,
      placeholder: 'Select a user role...',
      options: roles.map(r => ({ value: r.id, label: r.name })),
      hint: 'Defines dashboard permissions (Student, Instructor, Content Manager, Admin)'
    },
    { 
      key: 'blocked', 
      label: 'Account Status', 
      type: 'boolean',
      placeholder: 'Block this account (prevents login)',
      hint: 'When enabled, the user will be blocked from logging into the platform'
    }
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.id;
    
    // Password validation for create and update
    if (!isEditing) {
      const reqs = checkPasswordRequirements(formData.password);
      if (!reqs.isValid) {
        let msg = 'Password requirements are not fulfilled.';
        if (!reqs.minLength) msg = 'Password must be at least 12 characters long.';
        else if (!reqs.hasUppercase) msg = 'Password must contain at least 1 uppercase letter (A-Z).';
        else if (!reqs.hasLowercase) msg = 'Password must contain at least 1 lowercase letter (a-z).';
        else if (!reqs.hasSpecialChar) msg = 'Password must contain at least 1 sign or special character (!@#$%^&* etc.).';
        toast.error(msg);
        throw new Error(msg);
      }
    } else if (isEditing && formData.password && formData.password.trim()) {
      const reqs = checkPasswordRequirements(formData.password.trim());
      if (!reqs.isValid) {
        let msg = 'Password requirements are not fulfilled.';
        if (!reqs.minLength) msg = 'New password must be at least 12 characters long.';
        else if (!reqs.hasUppercase) msg = 'New password must contain at least 1 uppercase letter (A-Z).';
        else if (!reqs.hasLowercase) msg = 'New password must contain at least 1 lowercase letter (a-z).';
        else if (!reqs.hasSpecialChar) msg = 'New password must contain at least 1 sign or special character (!@#$%^&* etc.).';
        toast.error(msg);
        throw new Error(msg);
      }
    }

    // For users API in Strapi, it's typically /api/users/:id and expects flat payload, not wrapped in `data`
    const payload: any = {
      username: formData.username,
      email: formData.email,
      role: formData.role ? Number(formData.role) : undefined,
      blocked: !!formData.blocked
    };

    if (!isEditing) {
      // Create user needs a password
      payload.password = formData.password;
      payload.confirmed = true;
    } else if (isEditing && formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/${editingData.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users`;
      
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
    
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/${row.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Failed to delete user');
      toast.success(`User "${row.username}" deleted.`);
      fetchUsersAndRoles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
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
