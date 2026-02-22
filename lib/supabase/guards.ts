import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAuthContext,
  type AppRole,
  type AuthContext
} from '@/lib/supabase/authorization';

type ApiGuardSuccess = {
  supabase: SupabaseClient;
  authContext: AuthContext;
};

type ApiGuardFailure = {
  response: NextResponse;
};

const SUPPORT_AGENT_ROLES: AppRole[] = ['support_agent', 'admin', 'super_admin'];
const ANY_ADMIN_ROLES: AppRole[] = ['support_agent', 'admin', 'super_admin'];
const ADMIN_ROLES: AppRole[] = ['admin', 'super_admin'];
const SUPER_ADMIN_ROLES: AppRole[] = ['super_admin'];
const CONTENT_OPS_ROLES: AppRole[] = ['admin', 'super_admin'];

function hasAnyRole(role: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(role);
}

async function requireRolesPage(
  allowedRoles: AppRole[],
  fallbackPath: string
) {
  const supabase = await createClient();
  const authContext = await getAuthContext(supabase);

  if (!authContext) {
    redirect('/sign-in');
  }

  if (!hasAnyRole(authContext.role, allowedRoles)) {
    redirect(fallbackPath);
  }

  return { supabase, authContext };
}

async function requireRolesApi(allowedRoles: AppRole[]): Promise<ApiGuardSuccess | ApiGuardFailure> {
  const supabase = await createClient();
  const authContext = await getAuthContext(supabase);

  if (!authContext) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (!hasAnyRole(authContext.role, allowedRoles)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabase, authContext };
}

export async function requirePageAuth() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return { supabase, user };
}

export async function requireSupportPage() {
  return requireRolesPage(SUPPORT_AGENT_ROLES, '/admin');
}

export async function requireSupport() {
  return requireSupportPage();
}

export async function requireAdminPage() {
  return requireRolesPage(ADMIN_ROLES, '/admin');
}

export async function requireAdmin() {
  return requireAdminPage();
}

export async function requireSuperAdminPage() {
  return requireRolesPage(SUPER_ADMIN_ROLES, '/admin');
}

export async function requireSuperAdmin() {
  return requireSuperAdminPage();
}

export async function requireAnyAdminRolePage() {
  return requireRolesPage(ANY_ADMIN_ROLES, '/support/chat');
}

export async function requireContentOpsPage() {
  return requireRolesPage(CONTENT_OPS_ROLES, '/admin');
}

export async function requireSupportApi(): Promise<ApiGuardSuccess | ApiGuardFailure> {
  return requireRolesApi(SUPPORT_AGENT_ROLES);
}

export async function requireAdminApi(): Promise<ApiGuardSuccess | ApiGuardFailure> {
  return requireRolesApi(ADMIN_ROLES);
}

export async function requireSuperAdminApi(): Promise<ApiGuardSuccess | ApiGuardFailure> {
  return requireRolesApi(SUPER_ADMIN_ROLES);
}

export async function requireAnyAdminRoleApi(): Promise<ApiGuardSuccess | ApiGuardFailure> {
  return requireRolesApi(ANY_ADMIN_ROLES);
}

export async function requireContentOpsApi(): Promise<ApiGuardSuccess | ApiGuardFailure> {
  return requireRolesApi(CONTENT_OPS_ROLES);
}
