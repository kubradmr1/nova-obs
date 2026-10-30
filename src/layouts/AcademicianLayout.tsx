import { ClipboardList, LayoutDashboard, MessageSquare, QrCode } from 'lucide-react';
import { UNIVERSITY_NAME } from '@/config/branding';
import { findAcademicianById, getAcademicianIdForSession } from '@/data/academicians';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useMessaging } from '@/hooks/useMessaging';
import type { MessageKey } from '@/i18n/messages';
import { PanelLayout, type PanelNavItem } from '@/layouts/PanelLayout';

const PAGE_TITLE_KEYS: Record<string, MessageKey> = {
  '/hoca': 'nav.academic.overview',
  '/hoca/not-girisi': 'nav.academic.grades',
  '/hoca/yoklama': 'nav.academic.attendance',
  '/hoca/mesajlar': 'nav.academic.messages',
};

export function AcademicianLayout() {
  const { session } = useAuth();
  const { chats } = useMessaging();
  const { t } = useI18n();
  const academicianId = session?.academicianKey ?? (session
    ? getAcademicianIdForSession(session)
    : '');
  const profile = findAcademicianById(academicianId);

  const unread = chats
    .filter((chat) => chat.academicianId === academicianId)
    .reduce((total, chat) => total + chat.unreadForAcademician, 0);

  const navItems: PanelNavItem[] = [
    { to: '/hoca', label: t('nav.academic.overview'), icon: LayoutDashboard, end: true },
    { to: '/hoca/not-girisi', label: t('nav.academic.grades'), icon: ClipboardList },
    { to: '/hoca/yoklama', label: t('nav.academic.attendance'), icon: QrCode },
    { to: '/hoca/mesajlar', label: t('nav.academic.messages'), icon: MessageSquare, badge: unread },
  ];

  const pageTitles = Object.fromEntries(
    Object.entries(PAGE_TITLE_KEYS).map(([path, key]) => [path, t(key)]),
  );

  return (
    <PanelLayout
      role="academic"
      portalLabel={t('panel.portal.academic')}
      navItems={navItems}
      pageTitles={pageTitles}
      term={t('common.term')}
      userSubtitle={profile?.department ?? t('role.academic.tab')}
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · ${t('panel.footer.academic')}`}
      messageHref="/hoca/mesajlar"
      unreadMessages={unread}
      sidebarExtra={
        <div className="rounded-2xl border border-brand-200/60 bg-[linear-gradient(135deg,rgba(124,92,255,0.12),rgba(56,189,248,0.08))] p-3.5 dark:border-brand-400/15 dark:bg-brand-500/[0.08]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
            {t('sidebar.officeHours')}
          </p>
          <p className="mt-2 text-[11.5px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
            {profile?.officeHours ?? 'Salı 14.00 – 16.00'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            {t('sidebar.office', { office: profile?.office ?? 'D-310' })}
          </p>
        </div>
      }
    />
  );
}
