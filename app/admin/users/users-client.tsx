'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type UserRow = {
  id: string;
  full_name: string | null;
  role: 'user' | 'support_agent' | 'admin' | 'super_admin';
  is_banned: boolean;
  created_at: string;
};

type UsersResponse = {
  error?: string;
  users?: UserRow[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadUsers = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${nextPage}&pageSize=${pageSize}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as UsersResponse;
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to load users.');
        return;
      }

      setUsers(payload.users ?? []);
      setTotal(payload.pagination?.total ?? 0);
      setPage(payload.pagination?.page ?? nextPage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(1);
  }, [loadUsers]);

  const updateRole = async (id: string, role: UserRow['role']) => {
    setStatus('');
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update role.');
      return;
    }

    setStatus('Role updated.');
    void loadUsers(page);
  };

  const toggleBan = async (id: string, isBanned: boolean) => {
    setStatus('');
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_banned: !isBanned })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? 'Unable to update user ban state.');
      return;
    }

    setStatus(!isBanned ? 'User banned.' : 'User unbanned.');
    void loadUsers(page);
  };

  const exportUsers = async () => {
    setStatus('');
    const response = await fetch('/api/admin/users?export=csv', { cache: 'no-store' });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setStatus(payload.error ?? 'Unable to export users.');
      return;
    }

    const csv = await response.text();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'users.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Users exported.');
  };

  return (
    <section className="space-y-4 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-2 text-black/70">
          Manage role assignments for user, support_agent, admin, and super_admin accounts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="#users-list" className="btn-primary">Save Role</a>
          <Link href="/admin" className="btn-subtle">Back to Admin</Link>
          <button type="button" className="btn-subtle" onClick={exportUsers}>
            Export CSV
          </button>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Least-privilege access</h2>
        <p className="mt-3 text-black/70">
          Grant elevated roles only when operationally necessary and review regularly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/audit-log" className="btn-subtle">View Audit Log</Link>
          <Link href="/admin/privacy-requests" className="btn-subtle">Open Privacy Requests</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">User lifecycle</h2>
        <p className="mt-3 text-black/70">
          Review account age and role history before applying privilege changes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/chats" className="btn-subtle">Open Chats Inbox</Link>
          <a href="mailto:legal@jasonworldoftech.com" className="btn-subtle">Contact Legal</a>
        </div>
      </article>

      <div id="users-list" className="space-y-3">
        {loading ? <article className="card">Loading users...</article> : null}
        {!loading && users.length === 0 ? <article className="card">No users found.</article> : null}
        {users.map((user) => (
          <article key={user.id} className="card">
            <p className="text-sm text-black/60">ID: {user.id}</p>
            <p className="mt-1 font-semibold">{user.full_name || 'Unnamed user'}</p>
            <p className="text-xs text-black/50">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={user.role}
                onChange={(event) => {
                  const nextRole = event.target.value as UserRow['role'];
                  setUsers((prev) =>
                    prev.map((existing) =>
                      existing.id === user.id ? { ...existing, role: nextRole } : existing
                    )
                  );
                }}
                className="rounded-lg border border-black/20 p-2"
              >
                <option value="user">user</option>
                <option value="support_agent">support_agent</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => updateRole(user.id, user.role)}
              >
                Save Role
              </button>
              <button
                type="button"
                className="btn-subtle"
                onClick={() => toggleBan(user.id, user.is_banned)}
              >
                {user.is_banned ? 'Unban' : 'Ban'}
              </button>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.1em] text-black/50">
              {user.is_banned ? 'banned' : 'active'}
            </p>
          </article>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-subtle"
          disabled={page <= 1 || loading}
          onClick={() => void loadUsers(page - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-black/70">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-subtle"
          disabled={page >= totalPages || loading}
          onClick={() => void loadUsers(page + 1)}
        >
          Next
        </button>
      </div>

      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </section>
  );
}
