'use client';

import type { ReactNode } from 'react';
import { AdminShell } from '../../src/components/admin-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
