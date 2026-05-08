"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/src/i18n/routing';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <select
      value={locale}
      onChange={handleLocaleChange}
      className="p-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
    >
      <option value="en">English</option>
      <option value="de">Deutsch (German)</option>
      <option value="es">Español (Spanish)</option>
      <option value="fr">Français (French)</option>
      <hr className="m-2 py-1.5" />
      <option value="hi">हिन्दी (Hindi)</option>      
      <option value="ar">العربية (Arabic)</option>
      <option value="zh">中文 (Mandarin)</option>
    </select>
  );
}
