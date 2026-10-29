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
  ScrollText,
  UserCog,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { UNIVERSITY_NAME } from '@/config/branding';
import { findAcademicianByName } from '@/data/academicians';
import { STUDENT } from '@/data/student';
import { useMessaging } from '@/hooks/useMessaging';
import {
  PanelLayout,
  type PanelNavGroup,
  type PanelNavItem,
} from '@/layouts/PanelLayout';

const PAGE_TITLES: Record<string, string> = {
  '/panel': 'Genel Bakış',
  '/panel/duyurular': 'Duyurular',
  '/panel/dersler': 'Derslerim & Notlarım',
  '/panel/ders-kaydi': 'Ders Kaydı & Müfredat',
  '/panel/sinavlar': 'Sınav Takvimi & Notlar',
  '/panel/gano': 'Harf Notu & GANO Simülatörü',
  '/panel/devamsizlik': 'Devamsızlık Takibi',
  '/panel/transkript': 'Transkript',
  '/panel/mesajlar': 'Mesajlarım',
  '/panel/formlar': 'Formlar & Belgeler',
  '/panel/hesap': 'Profil & Güvenlik',
};

function ProgramBadge() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/75 bg-[linear-gradient(135deg,rgba(124,92,255,0.12),rgba(34,211,238,0.08))] px-2.5 py-2 shadow-[0_18px_38px_-32px_rgba(30,20,80,0.55)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-brand-500/[0.07]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-brand-600 shadow-sm dark:bg-white/[0.08] dark:text-brand-300">
          <CloudCog className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-brand-600/80 dark:text-brand-300/80">
            Program
          </p>
          <p className="truncate text-[10px] font-semibold leading-tight text-slate-700 dark:text-slate-200">
            Bulut Bilişim Operatörlüğü
          </p>
          <p className="mt-0.5 text-[8.5px] text-slate-400 dark:text-slate-500">
            {STUDENT.classYear} · Ön Lisans
          </p>
        </div>
      </div>
    </div>
  );
}

function AdvisorCard() {
  const advisor = findAcademicianByName(STUDENT.advisor);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-[linear-gradient(135deg,rgba(124,92,255,0.14),rgba(56,189,248,0.09))] p-3 backdrop-blur-xl dark:border-brand-400/15 dark:bg-brand-500/[0.08]">
      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
        Danışman Akademisyen
      </p>
      <div className="mt-2 flex items-start gap-2">
        <Avatar name={STUDENT.advisor} size="sm" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
            {STUDENT.advisor}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-slate-400 dark:text-slate-500">
            {advisor?.officeHours ?? 'Salı 14.00 – 16.00'} · Ofis {advisor?.office ?? 'V-204'}
          </p>
        </div>
      </div>
      <Link
        to="/panel/mesajlar"
        className="mt-2.5 inline-flex items-center gap-1 rounded-lg text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
      >
        Danışmana mesaj gönder
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );
}

export function StudentLayout() {
  const { chats } = useMessaging();
  const unread = chats
    .filter((chat) => chat.studentId === STUDENT.identifier)
    .reduce((total, chat) => total + chat.unreadForStudent, 0);

  const navGroups: PanelNavGroup[] = [
    {
      label: 'Genel İşlemler',
      icon: LayoutDashboard,
      tone: 'brand',
      items: [
        { to: '/panel', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
        { to: '/panel/duyurular', label: 'Duyurular', icon: Megaphone },
        { to: '/panel/mesajlar', label: 'Mesajlarım', icon: MessageSquare, badge: unread },
      ],
    },
    {
      label: 'Ders ve Dönem İşlemleri',
      icon: BookOpenCheck,
      tone: 'sky',
      items: [
        { to: '/panel/dersler', label: 'Derslerim & Notlarım', icon: BookOpenCheck },
        { to: '/panel/ders-kaydi', label: 'Ders Kaydı & Müfredat', icon: ClipboardList },
        { to: '/panel/sinavlar', label: 'Sınav Takvimi', icon: CalendarClock },
        { to: '/panel/gano', label: 'GANO Simülatörü', icon: Calculator },
        { to: '/panel/devamsizlik', label: 'Devamsızlık Takibi', icon: CalendarCheck },
        { to: '/panel/transkript', label: 'Transkript', icon: ScrollText },
      ],
    },
    {
      label: 'Form İşlemleri',
      icon: FileText,
      tone: 'amber',
      items: [{ to: '/panel/formlar', label: 'Formlar & Belgeler', icon: FileText }],
    },
    {
      label: 'Kullanıcı İşlemleri',
      icon: UserCog,
      tone: 'emerald',
      items: [{ to: '/panel/hesap', label: 'Profil & Güvenlik', icon: UserCog }],
    },
  ];

  const navItems: PanelNavItem[] = navGroups.flatMap((group) => group.items);

  return (
    <PanelLayout
      role="student"
      portalLabel="Öğrenci Paneli"
      navItems={navItems}
      navGroups={navGroups}
      sidebarTop={<ProgramBadge />}
      pageTitles={PAGE_TITLES}
      term={STUDENT.term}
      userSubtitle={STUDENT.classYear}
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · Öğrenci Bilgi Sistemi · Demo verilerle hazırlanmıştır`}
      sidebarExtra={<AdvisorCard />}
      messageHref="/panel/mesajlar"
      unreadMessages={unread}
    />
  );
}
