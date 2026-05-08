import AssistantPage from '@/app/pages/Assistant';
import * as clerk from '@clerk/nextjs/server';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await clerk.currentUser();


  if (!user) {
    return (
      redirect(`/${locale}/sign-in?redirect_url=/${locale}/assistant`)
    );
  }

  return (
    <AssistantPage/>
  );
}
