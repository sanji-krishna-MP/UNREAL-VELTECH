import { createClient } from './supabase/server';
import { UserRole, UserProfile, EmployeeRecord } from './types';

export interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  employee?: EmployeeRecord;
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    let employee: EmployeeRecord | undefined = undefined;

    if (profile.role === 'employee') {
      const { data: empData } = await supabase
        .from('employees')
        .select('*, department:departments(*)')
        .eq('user_id', user.id)
        .single();

      if (empData) {
        employee = empData as EmployeeRecord;
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
      },
      profile: {
        user_id: profile.user_id,
        organization_id: profile.organization_id,
        role: profile.role as UserRole,
        email: user.email || '',
      },
      employee,
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

export async function requireOfficer(): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  if (session.profile.role !== 'officer') {
    throw new Error('Forbidden: Officer role required');
  }
  return session;
}

export async function requireEmployee(): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  if (session.profile.role !== 'employee' || !session.employee) {
    throw new Error('Forbidden: Employee access required');
  }
  return session;
}
