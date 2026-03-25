import { redirect } from 'next/navigation';

export default function LabOwnerDashboardRedirect() {
  redirect('/login');
}
