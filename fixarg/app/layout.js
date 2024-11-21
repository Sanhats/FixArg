import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FixArg',
  description: 'Servicios profesionales a tu alcance',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}