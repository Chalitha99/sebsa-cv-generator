'use server';

import { getCurrentUser } from '@/lib/auth';
import { recordAuditLog } from '@/services/audit-service';

/** Records a completed client-side PDF export without changing the CV or profile being exported. */
export async function recordCvDownloadAction(
  profileId: string,
  options: { anonymous: boolean; customized: boolean }
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  await recordAuditLog({
    actorId: user.id,
    action: 'DOWNLOAD',
    entityType: options.customized ? 'generated_cv' : 'employee_profile',
    entityId: profileId,
    metadata: { format: 'pdf', anonymous: options.anonymous },
  });
}
