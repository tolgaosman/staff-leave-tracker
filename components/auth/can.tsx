import { useAuth } from './auth-provider';

export function useAbility() {
  const { user } = useAuth();

  const can = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('super_admin') || user.role === 'super_admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  return { can };
}

export function Can({ I, children }: { I: string; children: React.ReactNode }) {
  const { can } = useAbility();
  if (can(I)) return <>{children}</>;
  return null;
}
