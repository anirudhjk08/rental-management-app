import { AuthProvider } from '@/lib/AuthContext';
import './globals.css';

export const metadata = {
  title: 'Rental Management App',
  description: 'Manage your rental relationships',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}