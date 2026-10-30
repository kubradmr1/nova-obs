import {
  BookPlus,
  LayoutDashboard,
  Megaphone,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { UNIVERSITY_NAME } from '@/config/branding';
import { useI18n } from '@/hooks/useI18n';
import type { MessageKey } from '@/i18n/messages';
import { PanelLayout, type PanelNavItem } from '@/layouts/PanelLayout';

const PAGE_TITLE_KEYS: Record<string, MessageKey> = {
  '/yonetim': 'nav.admin.overview',
  '/yonetim/ogrenci-kaydi': 'nav.admin.studentRegistration',
  '/yonetim/akademisyen-kaydi': 'nav.admin.academicianRegistration',
  '/yonetim/ders-tanimlama': 'nav.admin.courseDefinition',
  '/yonetim/duyurular': 'nav.admin.announcements',
};

export function AdminLayout() {
  const { t } = useI18n();

  const navItems: PanelNavItem[] = [
    { to: '/yonetim', label: t('nav.admin.overview'), icon: LayoutDashboard, end: true },
    { to: '/yonetim/ogrenci-kaydi', label: t('nav.admin.studentRegistration'), icon: UserPlus },
    { to: '/yonetim/akademisyen-kaydi', label: t('nav.admin.academicianRegistration'), icon: UserCheck },
    { to: '/yonetim/ders-tanimlama', label: t('nav.admin.courseDefinition'), icon: BookPlus },
    { to: '/yonetim/duyurular', label: t('nav.admin.announcements'), icon: Megaphone },
  ];

  const pageTitles = Object.fromEntries(
    Object.entries(PAGE_TITLE_KEYS).map(([path, key]) => [path, t(key)]),
  );

  return (
    <PanelLayout
      role="admin"
      portalLabel={t('panel.portal.admin')}
      navItems={navItems}
      pageTitles={pageTitles}
      term={t('common.term')}
      userSubtitle={t('sidebar.fullAccess')}
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · ${t('panel.footer.admin')}`}
      sidebarExtra={
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 p-3.5 dark:border-emerald-400/15 dark:bg-emerald-500/[0.08]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
            {t('sidebar.systemStatus')}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('sidebar.servicesActive')}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            {t('sidebar.lastAudit')}
          </p>
        </div>
      }
    />
  );
}
