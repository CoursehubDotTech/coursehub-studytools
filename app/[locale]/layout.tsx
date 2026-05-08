import type { Metadata } from 'next'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import ThemeSelector from "../components/ThemeSelector";
import LocaleSwitcher from "../components/LocaleSwitcher";
import { ThemeProvider } from '../contexts/ThemeContext';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/src/i18n/routing';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CourseHub StudyTools',
  description: 'CourseHub StudyTools is an AI-powered study assistant where students can learn tech through clean lessons and earn shareable certificates. No paywalls, no friction.',
  icons: {
    icon: '/favicon.svg',
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({locale, namespace: 'Common'});

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${locale === 'ar' ? 'rtl' : 'ltr'} bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <ClerkProvider>
            <ThemeProvider> 
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <Show when="signed-out">
                  <SignInButton mode="modal" />
                  <SignUpButton mode="modal" />
                </Show>
                <Show when="signed-in">
                  <UserButton/>
                </Show>
                <LocaleSwitcher />
                <ThemeSelector />
              </header>
              {children}
            </ThemeProvider>
          </ClerkProvider>
          <footer className={"p-2 mt-8"}>
            <p>&copy; CourseHub StudyTools {new Date().getFullYear()} - {t('allRightsReserved')}</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
