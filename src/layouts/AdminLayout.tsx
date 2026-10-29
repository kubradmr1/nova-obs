import {
  BookPlus,
  LayoutDashboard,
  Megaphone,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { PanelLayout, type PanelNavItem } from '@/layouts/PanelLayout';
import { UNIVERSITY_NAME } from '@/config/branding';

const PAGE_TITLES: Record<string, string> = {
  '/yonetim': 'Dashboard',
  '/yonetim/ogrenci-kaydi': 'Öğrenci Kaydı',
  '/yonetim/akademisyen-kaydi': 'Akademisyen Kaydı',
  '/yonetim/ders-tanimlama': 'Ders Tanımlama',
  '/yonetim/duyurular': 'Duyuru Yönetimi',
};

const NAV_ITEMS: PanelNavItem[] = [
  { to: '/yonetim', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/yonetim/ogrenci-kaydi', label: 'Öğrenci Kaydı', icon: UserPlus },
  { to: '/yonetim/akademisyen-kaydi', label: 'Akademisyen Kaydı', icon: UserCheck },
  { to: '/yonetim/ders-tanimlama', label: 'Ders Tanımlama', icon: BookPlus },
  { to: '/yonetim/duyurular', label: 'Duyuru Yönetimi', icon: Megaphone },
];

export function AdminLayout() {
  return (
    <PanelLayout
      role="admin"
      portalLabel="Yönetim Paneli"
      navItems={NAV_ITEMS}
      pageTitles={PAGE_TITLES}
      term="2026–2027 Güz"
      userSubtitle="Tam yetki"
      footerLabel={`© 2026 ${UNIVERSITY_NAME} · Yönetim Paneli · Demo verilerle hazırlanmıştır`}
      sidebarExtra={
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 p-3.5 dark:border-emerald-400/15 dark:bg-emerald-500/[0.08]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
            Sistem Durumu
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tüm servisler aktif
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
            Son denetim: bugün 08.30
          </p>
        </div>
      }
    />
  );
}
