"use client"
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export default function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  return <PrivacyContent params={params} />;
}

async function PrivacyContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = useTranslations('Privacy');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section1Title')}</h2>
            <p className="mb-4">{t('section1Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section2Title')}</h2>
            <p className="mb-4">{t('section2Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section3Title')}</h2>
            <p className="mb-4">{t('section3Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section4Title')}</h2>
            <p className="mb-4">{t('section4Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section5Title')}</h2>
            <p className="mb-4">{t('section5Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section6Title')}</h2>
            <p className="mb-4">{t('section6Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section7Title')}</h2>
            <p className="mb-4">{t('section7Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section8Title')}</h2>
            <p className="mb-4">{t('section8Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section9Title')}</h2>
            <p className="mb-4">{t('section9Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('section10Title')}</h2>
            <p className="mb-4">{t('section10Content')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">{t('lastUpdated')}</h2>
            <p className="text-sm text-muted-foreground">{t('lastUpdatedDate')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
