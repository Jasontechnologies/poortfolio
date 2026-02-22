import type { SupabaseClient, User } from '@supabase/supabase-js';

export type AppRole =
  | 'user'
  | 'support_agent'
  | 'admin'
  | 'super_admin'
  | 'editor'
  | 'support';

export type AuthContext = {
  user: User;
  role: AppRole;
};

function isKnownAppRole(value: string | null | undefined): value is AppRole {
  return (
    value === 'user' ||
    value === 'support_agent' ||
    value === 'admin' ||
    value === 'super_admin' ||
    value === 'editor' ||
    value === 'support'
  );
}

export async function getAuthContext(supabase: SupabaseClient): Promise<AuthContext | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return null;

  return {
    user,
    role: isKnownAppRole(data?.role) ? data.role : 'user'
  };
}

export function isAdminRole(role: AppRole) {
  return role === 'admin' || role === 'super_admin';
}

export function isSupportRole(role: AppRole) {
  return role === 'support_agent' || role === 'support' || isAdminRole(role);
}

export function isSuperAdminRole(role: AppRole) {
  return role === 'super_admin';
}

export function canManageContent(role: AppRole) {
  return isAdminRole(role) || role === 'editor';
}

export function canSupport(role: AppRole) {
  return isSupportRole(role);
}
