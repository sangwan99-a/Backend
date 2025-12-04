export class RBACService {
  private roles: Record<string, string[]> = {
    admin: ['read', 'write', 'delete'],
    user: ['read', 'write'],
    guest: ['read'],
  };

  checkPermission(role: string, action: string): boolean {
    const permissions = this.roles[role] || [];
    return permissions.includes(action);
  }
}