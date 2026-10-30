import type { ReactNode } from 'react';
import { AuthProvider } from '../src/context/auth-context';

export const metadata = {
  title: 'CodedDevs Admin',
  description:
    'Internal content management system for CodedDevs Technology LTD',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
