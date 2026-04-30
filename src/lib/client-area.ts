import { requireCurrentUser } from '@/lib/auth/session';
import { getUserServiceAccess } from '@/lib/services/catalog';

export async function getClientAreaContext() {
  const user = await requireCurrentUser();
  const access = await getUserServiceAccess(user.id);

  return {
    user,
    serviceAccess: access,
    services: access.map((entry) => ({
      slug: entry.service.slug,
      name: entry.service.name,
      icon: entry.service.icon
    }))
  };
}
