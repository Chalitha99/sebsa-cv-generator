import { redirect } from 'next/navigation';
import { getCurrentUser, isReviewerOrAbove } from '@/lib/auth';
import { listPendingItemsAction } from './actions';
import ReviewClient from './ReviewClient';

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.role === 'employee') redirect(`/repository/${user.profileId}`);
  if (!isReviewerOrAbove(user.role)) redirect('/repository');

  const items = await listPendingItemsAction();

  return <ReviewClient initialItems={items} />;
}
