import { ClipboardList, LayoutDashboard, MessageSquare } from 'lucide-react';
import { UNIVERSITY_NAME } from '@/config/branding';
import { ACADEMICIAN_COURSES } from '@/data/academician';
import { findAcademicianById, getAcademicianIdForSession } from '@/data/academicians';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging } from '@/hooks/useMessaging';
import { PanelLayout, type PanelNavItem } from '@/layouts/PanelLayout';

const PAGE_TITLES: Record<string, string> = {
  '/hoca': 'Dashboard',
  '/hoca/not-girisi': 'Dersler & Not Girişi',
  '/hoca/mesajlar': 'Mesajlar',
};

export function AcademicianLayout() {
  const { session } = useAuth();
  const { chats } = useMessaging();
  const academicianId = session ? getAcademicianIdForSession(session) : '';
  const profile = findAcademicianById(academicianId);

  const unread = chats
    .filter((chat) => chat.academicianId === academicianId)
    .reduce((total, chat) => total + chat.unreadForAcademician, 0);

  const navItems: PanelNavItem[] = [
    { to: '/hoca', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/hoca/not-girisi', label: 'Dersler & Not Girişi', icon: ClipboardList },
    { to: '/hoca/mesajlar', label: 'Mesajlar', icon: MessageSquare, badge: unread },
  ];

  return (
    <PanelLayout
      role="academic"
      portalLabel="Akademisyen Paneli"
      navItems={navItems}
      pageTitles={PAGE_TITLES}
      term={ACADEMICIAN_COURSES[0]?.term ?? '2026–2027 Güz'}
      userSubtitle={profile?.department ?? 'Akademisyen'}
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · Akademisyen Paneli · Demo verilerle hazırlanmıştır`}
      messageHref="/hoca/mesajlar"
      unreadMessages={unread}
      sidebarExtra={
        <div className="rounded-2xl border border-brand-200/60 bg-[linear-gradient(135deg,rgba(124,92,255,0.12),rgba(56,189,248,0.08))] p-3.5 dark:border-brand-400/15 dark:bg-brand-500/[0.08]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
            Görüşme Saatleri
          </p>
          <p className="mt-2 text-[11.5px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
            {profile?.officeHours ?? 'Salı 14.00 – 16.00'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            Ofis {profile?.office ?? 'D-310'} · Randevusuz görüşme
          </p>
        </div>
      }
    />
  );
}
