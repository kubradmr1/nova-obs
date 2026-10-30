import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck,
  CalendarClock,
  Calculator,
  ClipboardList,
  CloudCog,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  QrCode,
  ScrollText,
  UserCog,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { UNIVERSITY_NAME } from '@/config/branding';
import { findAcademicianByName } from '@/data/academicians';
import { STUDENT } from '@/data/student';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { localizeClassYear } from '@/utils/localeData';
import { useMessaging } from '@/hooks/useMessaging';
import type { MessageKey } from '@/i18n/messages';
import {
  PanelLayout,
  type PanelNavGroup,
  type PanelNavItem,
} from '@/layouts/PanelLayout';

const PAGE_TITLE_KEYS: Record<string, MessageKey> = {
  '/panel': 'nav.student.overview',
  '/panel/duyurular': 'nav.student.announcements',
  '/panel/dersler': 'nav.student.courses',
  '/panel/ders-kaydi': 'nav.student.registration',
  '/panel/sinavlar': 'nav.student.exams',
  '/panel/gano': 'nav.student.gpa',
  '/panel/yoklama': 'nav.student.qr',
  '/panel/devamsizlik': 'nav.student.attendance',
  '/panel/transkript': 'nav.student.transcript',
  '/panel/mesajlar': 'nav.student.messages',
  '/panel/formlar': 'nav.student.forms',
  '/panel/hesap': 'nav.student.account',
};

function ProgramBadge() {
  const { t, locale } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/75 bg-[linear-gradient(135deg,rgba(124,92,255,0.12),rgba(34,211,238,0.08))] px-2.5 py-2 shadow-[0_18px_38px_-32px_rgba(30,20,80,0.55)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-brand-500/[0.07]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-brand-600 shadow-sm dark:bg-white/[0.08] dark:text-brand-300">
          <CloudCog className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-brand-600/80 dark:text-brand-300/80">
            {t('sidebar.program')}
          </p>
          <p className="truncate text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
            {t('brand.program')}
          </p>
          <p className="mt-0.5 text-[8.5px] text-slate-400 dark:text-slate-500">
            {t('sidebar.class', { year: localizeClassYear(STUDENT.classYear, locale) })}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdvisorCard() {
  const advisor = findAcademicianByName(STUDENT.advisor);
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(56,189,248,0.09))] p-3 backdrop-blur-xl dark:border-brand-400/15 dark:bg-brand-500/[0.08]">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
        {t('sidebar.advisor')}
      </p>
      <div className="mt-2 flex items-start gap-2">
        <Avatar name={STUDENT.advisor} size="sm" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
            {STUDENT.advisor}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-slate-400 dark:text-slate-500">
            {t('sidebar.office', { office: advisor?.office ?? 'V-204' })}
          </p>
        </div>
      </div>
      <Link
        to="/panel/mesajlar"
        className="mt-2.5 inline-flex items-center gap-1 rounded-lg text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
      >
        {t('sidebar.advisorMessage')}
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );
}

export function StudentLayout() {
  const { session } = useAuth();
  const { chats } = useMessaging();
  const { t, locale } = useI18n();
  const studentKey =
    session?.provider === 'supabase' ? (session.profileId ?? '') : STUDENT.identifier;
  const unread = chats
    .filter((chat) => chat.studentId === studentKey)
    .reduce((total, chat) => total + chat.unreadForStudent, 0);

  const navGroups: PanelNavGroup[] = [
    {
      label: t('nav.groups.general'),
      icon: LayoutDashboard,
      tone: 'brand',
      items: [
        { to: '/panel', label: t('nav.student.overview'), icon: LayoutDashboard, end: true },
        { to: '/panel/duyurular', label: t('nav.student.announcements'), icon: Megaphone },
        { to: '/panel/mesajlar', label: t('nav.student.messages'), icon: MessageSquare, badge: unread },
      ],
    },
    {
      label: t('nav.groups.academic'),
      icon: BookOpenCheck,
      tone: 'sky',
      items: [
        { to: '/panel/dersler', label: t('nav.student.courses'), icon: BookOpenCheck },
        { to: '/panel/ders-kaydi', label: t('nav.student.registration'), icon: ClipboardList },
        { to: '/panel/sinavlar', label: t('nav.student.exams'), icon: CalendarClock },
        { to: '/panel/gano', label: t('nav.student.gpa'), icon: Calculator },
        { to: '/panel/yoklama', label: t('nav.student.qr'), icon: QrCode },
        { to: '/panel/devamsizlik', label: t('nav.student.attendance'), icon: CalendarCheck },
        { to: '/panel/transkript', label: t('nav.student.transcript'), icon: ScrollText },
      ],
    },
    {
      label: t('nav.groups.forms'),
      icon: FileText,
      tone: 'amber',
      items: [{ to: '/panel/formlar', label: t('nav.student.forms'), icon: FileText }],
    },
    {
      label: t('nav.groups.user'),
      icon: UserCog,
      tone: 'emerald',
      items: [{ to: '/panel/hesap', label: t('nav.student.account'), icon: UserCog }],
    },
  ];

  const navItems: PanelNavItem[] = navGroups.flatMap((group) => group.items);
  const pageTitles = Object.fromEntries(
    Object.entries(PAGE_TITLE_KEYS).map(([path, key]) => [path, t(key)]),
  );

  return (
    <PanelLayout
      role="student"
      portalLabel={t('panel.portal.student')}
      navItems={navItems}
      navGroups={navGroups}
      sidebarTop={<ProgramBadge />}
      pageTitles={pageTitles}
      term={t('common.term')}
      userSubtitle={localizeClassYear(STUDENT.classYear, locale)}
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · ${t('panel.footer.student')}`}
      sidebarExtra={<AdvisorCard />}
      messageHref="/panel/mesajlar"
      unreadMessages={unread}
    />
  );
}
