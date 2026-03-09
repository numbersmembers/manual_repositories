import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bloter/Numbers Manual Repositories',
  description: '업무 매뉴얼 등 필요 문서 박스',
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: 'Bloter/Numbers Manual Repositories',
    description: '업무 매뉴얼 등 필요 문서 박스',
    images: ['/opengraph.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
