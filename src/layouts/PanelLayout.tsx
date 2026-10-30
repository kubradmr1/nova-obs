import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UNIVERSITY_NAME, UNIVERSITY_SHORT } from '@/config/branding';
import { getHomePath } from '@/config/roles';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { Role } from '@/types/auth';
import { cx } from '@/utils/cx';

export interface PanelNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

export interface PanelNavGroup {
  label: string;
  icon: LucideIcon;
  tone: 'brand' | 'sky' | 'amber' | 'emerald';
  items: PanelNavItem[];
}

const GROUP_TONES: Record<
  PanelNavGroup['tone'],
  { icon: string; glow: string }
> = {
  brand: {
    icon: 'bg-brand-500/12 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    glow: 'bg-brand-400/25 dark:bg-brand-500/20',
  },
  sky: {
    icon: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    glow: 'bg-sky-400/25 dark:bg-sky-500/20',
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    glow: 'bg-amber-400/25 dark:bg-amber-500/20',
  },
  emerald: {
    icon: 'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    glow: 'bg-emerald-400/25 dark:bg-emerald-500/20',
  },
};

interface PanelLayoutProps {
  role: Role;
  portalLabel: string;
  navItems: PanelNavItem[];
  navGroups?: PanelNavGroup[];
  sidebarTop?: ReactNode;
  pageTitles: Record<string, string>;
  term: string;
  userSubtitle: string;
  footerLabel: string;
  sidebarExtra?: ReactNode;
  messageHref?: string;
  unreadMessages?: number;
}

interface NavRowProps {
  item: PanelNavItem;
  onNavigate?: () => void;
  compact?: boolean;
}

function NavRow({ item, onNavigate, compact = false }: NavRowProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center gap-2 font-semibold transition-all duration-200',
          compact
            ? 'rounded-xl px-2 py-1.5 text-[11px]'
            : 'rounded-2xl px-2.5 py-2.5 text-[12px]',
          isActive
            ? 'bg-[linear-gradient(110deg,#7c5cff,#5f6bff_55%,#a855f7)] text-white shadow-[0_16px_34px_-18px_rgba(124,92,255,0.95)]'
            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'flex shrink-0 items-center justify-center transition-colors',
              compact ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-xl',
              isActive
                ? 'bg-white/15 text-white'
                : 'bg-white/70 text-slate-500 shadow-sm group-hover:text-brand-600 dark:bg-white/[0.06] dark:text-slate-400 dark:shadow-none dark:group-hover:text-brand-300',
            )}
          >
            <Icon
              className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
              strokeWidth={2}
              aria-hidden
            />
          </span>
          <span className="min-w-0 flex-1 truncate leading-tight">{item.label}</span>
          {item.badge && item.badge > 0 ? (
            <span
              className={cx(
                'flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[8.5px] font-bold',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
              )}
            >
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
          <ChevronRight
            className={cx(
              'h-3.5 w-3.5 shrink-0 transition-all duration-200',
              isActive
                ? 'opacity-80'
                : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50',
            )}
            aria-hidden
          />
        </>
      )}
    </NavLink>
  );
}

interface NavGroupCardProps {
  group: PanelNavGroup;
  onNavigate?: () => void;
}

function NavGroupCard({ group, onNavigate }: NavGroupCardProps) {
  const GroupIcon = group.icon;
  const tone = GROUP_TONES[group.tone];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/75 bg-white/50 p-1.5 shadow-[0_18px_38px_-32px_rgba(30,20,80,0.55)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] dark:shadow-none">
      <span
        aria-hidden
        className={cx(
          'pointer-events-none absolute -right-7 -top-9 h-20 w-20 rounded-full blur-2xl',
          tone.glow,
        )}
      />
      <div className="relative flex items-center gap-1.5 px-1.5 pb-1 pt-0.5">
        <span
          className={cx(
            'flex h-5 w-5 items-center justify-center rounded-md',
            tone.icon,
          )}
        >
          <GroupIcon className="h-3 w-3" strokeWidth={2.1} aria-hidden />
        </span>
        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {group.label}
        </p>
      </div>
      <div className="relative space-y-0.5">
        {group.items.map((item) => (
          <NavRow key={item.to} item={item} onNavigate={onNavigate} compact />
        ))}
      </div>
    </section>
  );
}

interface SidebarContentProps {
  navItems: PanelNavItem[];
  navGroups?: PanelNavGroup[];
  sidebarTop?: ReactNode;
  portalLabel: string;
  sessionName: string;
  sessionIdentifier: string;
  userSubtitle: string;
  sidebarExtra?: ReactNode;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({
  navItems,
  navGroups,
  sidebarTop,
  portalLabel,
  sessionName,
  sessionIdentifier,
  userSubtitle,
  sidebarExtra,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  const { t } = useI18n();
  const hasGroups = Boolean(navGroups && navGroups.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div>
        <Logo />
      </div>

      {sidebarTop ? <div className="mt-4">{sidebarTop}</div> : null}

      {hasGroups ? (
        <nav
          aria-label={portalLabel}
          className={cx('space-y-2', sidebarTop ? 'mt-3' : 'mt-5')}
        >
          {navGroups!.map((group) => (
            <NavGroupCard key={group.label} group={group} onNavigate={onNavigate} />
          ))}
        </nav>
      ) : (
        <>
          <p className="mt-6 px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            {t('common.menu')}
          </p>
          <nav aria-label={portalLabel} className="mt-2 space-y-1">
            {navItems.map((item) => (
              <NavRow key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </nav>
        </>
      )}

      {sidebarExtra ? <div className="mt-4">{sidebarExtra}</div> : null}

      <div className="mt-auto pt-5">
        <div className="rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <Avatar name={sessionName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                {sessionName}
              </p>
              <p className="truncate text-[9.5px] text-slate-400 dark:text-slate-500">
                {userSubtitle !== sessionIdentifier
                  ? `${sessionIdentifier} · ${userSubtitle}`
                  : sessionIdentifier}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title={t('common.logout')}
              aria-label={t('common.logout')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-[9px] text-slate-300 dark:text-slate-600">
          © 2026 {UNIVERSITY_NAME}
        </p>
      </div>
    </div>
  );
}

export function PanelLayout({
  role,
  portalLabel,
  navItems,
  navGroups,
  sidebarTop,
  pageTitles,
  term,
  userSubtitle,
  footerLabel,
  sidebarExtra,
  messageHref,
  unreadMessages = 0,
}: PanelLayoutProps) {
  const { session, logout } = useAuth();
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== role) {
    return <Navigate to={getHomePath(session.role)} replace />;
  }

  const handleLogout = () => {
    void logout();
    navigate('/', { replace: true });
  };

  const pageTitle =
    pageTitles[location.pathname] ??
    (navGroups ? navGroups.flatMap((group) => group.items) : navItems).find(
      (item) => item.to === location.pathname,
    )?.label ??
    'Panel';
  const dateLabel = formatDate(new Date(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-32 h-[460px] w-[460px] rounded-full bg-brand-400/20 blur-[130px] dark:bg-brand-600/15" />
        <div className="absolute right-[-10%] top-[40%] h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-[130px] dark:bg-cyan-500/10" />
        <div className="bg-grid-soft absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_60%)]" />
      </div>

      <div className="relative lg:grid lg:grid-cols-[276px_minmax(0,1fr)] lg:gap-4 lg:p-4">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col overflow-y-auto rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_30px_70px_-50px_rgba(30,20,80,0.6)] backdrop-blur-2xl lg:flex dark:border-white/[0.08] dark:bg-[#0c0b19]/80 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] print:hidden">
          <SidebarContent
            navItems={navItems}
            navGroups={navGroups}
            sidebarTop={sidebarTop}
            portalLabel={portalLabel}
            sessionName={session.name}
            sessionIdentifier={session.identifier}
            userSubtitle={userSubtitle}
            sidebarExtra={sidebarExtra}
            onLogout={handleLogout}
          />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col lg:min-h-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/50 bg-[#eef1f9]/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:rounded-b-2xl lg:px-2 dark:border-white/[0.06] dark:bg-[#07060f]/80 print:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label={t('panel.menu.open')}
              aria-expanded={isMenuOpen}
              aria-controls="panel-mobile-nav"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-600 lg:hidden dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"
            >
              <Menu className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
              <span className="shrink-0 text-[11.5px] font-bold tracking-tight text-slate-700 dark:text-slate-200">
                {UNIVERSITY_SHORT}
              </span>
              <span
                className="hidden h-1 w-1 shrink-0 rounded-full bg-slate-300 sm:inline dark:bg-slate-600"
                aria-hidden
              />
              <span className="hidden text-slate-400 sm:inline dark:text-slate-500">
                {portalLabel}
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600"
                aria-hidden
              />
              <span className="truncate">{pageTitle}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9.5px] font-semibold text-slate-500 backdrop-blur md:inline-flex dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {term}
              </span>
              <span className="hidden text-[10px] text-slate-400 lg:inline dark:text-slate-500">
                {dateLabel}
              </span>
              {messageHref ? (
                <Link
                  to={messageHref}
                  title={t('panel.messages')}
                  aria-label={
                    unreadMessages > 0
                      ? t('panel.messagesUnread', { count: unreadMessages })
                      : t('panel.messages')
                  }
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-500 shadow-sm backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  {unreadMessages > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white ring-2 ring-[#eef1f9] dark:ring-[#07060f]">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  ) : null}
                </Link>
              ) : null}
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1220px] flex-1 px-4 pb-12 pt-5 sm:px-6 lg:px-2">
            <Outlet />
          </main>

          <footer className="mx-auto w-full max-w-[1220px] px-4 pb-5 text-[10px] text-slate-400 sm:px-6 lg:px-2 dark:text-slate-500 print:hidden">
            {footerLabel}
          </footer>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('panel.menu.close')}
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />
          <aside
            id="panel-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label={portalLabel}
            className="absolute inset-y-0 left-0 flex w-[292px] animate-slide-in flex-col overflow-y-auto rounded-r-[28px] border-r border-white/60 bg-[#f7f8fd] p-4 shadow-2xl dark:border-white/10 dark:bg-[#0c0b19]"
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('panel.menu.close')}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <SidebarContent
              navItems={navItems}
              navGroups={navGroups}
              sidebarTop={sidebarTop}
              portalLabel={portalLabel}
              sessionName={session.name}
              sessionIdentifier={session.identifier}
              userSubtitle={userSubtitle}
              sidebarExtra={sidebarExtra}
              onLogout={handleLogout}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
