import * as clerk from '@clerk/nextjs/server';
import Homepage from "../pages/Home";
import { setRequestLocale } from 'next-intl/server';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await clerk.currentUser();
  const userObj = user ? {
    fullName: user.fullName || '',
  } : null;

  return (
    <Homepage userObj={userObj}/>
  );
}
