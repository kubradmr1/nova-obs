import {
  ArrowRight,
  BookOpen,
  BookPlus,
  CalendarDays,
  Megaphone,
  Pin,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AudienceBadge, CategoryBadge } from '@/components/admin/AnnouncementBadges';
import { StatCard } from '@/components/student/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ACADEMICIANS_STORAGE_KEY,
  ANNOUNCEMENTS_STORAGE_KEY,
  COURSES_STORAGE_KEY,
  SEED_ACADEMICIANS,
  SEED_ANNOUNCEMENTS,
  SEED_COURSES,
  SEED_STUDENTS,
  STUDENTS_STORAGE_KEY,
} from '@/data/admin';
import { useAuth } from '@/hooks/useAuth';
import { readCollection } from '@/utils/storage';

const QUICK_ACTIONS = [
  {
    to: '/yonetim/ogrenci-kaydi',
    title: 'Öğrenci Kaydı',
    description: 'Yeni öğrenci ekle, sınıf ve bölüm ata.',
    icon: UserPlus,
    tile: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  },
  {
    to: '/yonetim/akademisyen-kaydi',
    title: 'Akademisyen Kaydı',
    description: 'Yeni akademik kadro oluştur.',
    icon: UserCheck,
    tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  },
  {
    to: '/yonetim/ders-tanimlama',
    title: 'Ders Tanımlama',
    description: 'Müfredata yeni ders ekle, hoca ata.',
    icon: BookPlus,
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
  {
    to: '/yonetim/duyurular',
    title: 'Duyuru Yayınla',
    description: 'Okul genelinde duyuru yayınla.',
    icon: Megaphone,
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
] as const;

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function AdminDashboardPage() {
  const { session } = useAuth();

  const { students, academicians, courses, announcements } = useMemo(
    () => ({
      students: readCollection(STUDENTS_STORAGE_KEY, SEED_STUDENTS),
      academicians: readCollection(ACADEMICIANS_STORAGE_KEY, SEED_ACADEMICIANS),
      courses: readCollection(COURSES_STORAGE_KEY, SEED_COURSES),
      announcements: readCollection(ANNOUNCEMENTS_STORAGE_KEY, SEED_ANNOUNCEMENTS),
    }),
    [],
  );

  const recentRecords = useMemo(
    () => [
      ...students.slice(0, 3).map((student) => ({
        key: `student-${student.id}`,
        name: `${student.firstName} ${student.lastName}`,
        line: `${student.studentNumber} · ${student.department}`,
        tag: 'Öğrenci',
        tagClass:
          'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
      })),
      ...academicians.slice(0, 2).map((academician) => ({
        key: `academician-${academician.id}`,
        name: `${academician.title} ${academician.firstName} ${academician.lastName}`,
        line: `${academician.department} · Ofis ${academician.office}`,
        tag: 'Akademisyen',
        tagClass:
          'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
      })),
    ],
    [students, academicians],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Yönetim Paneli"
        title={`Merhaba, ${session?.name ?? 'Sistem Yöneticisi'}`}
        description="Öğrenci ve akademisyen kayıtlarını yönet, ders tanımla ve okul genelindeki duyuruları tek panelden yayınla."
        actions={
          <Link
            to="/yonetim/duyurular"
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(110deg,#7c5cff_0%,#5f6bff_48%,#a855f7_100%)] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_16px_34px_-18px_rgba(124,92,255,0.9)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden />
            Duyuru yayınla
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kayıtlı Öğrenci"
          value={String(students.length)}
          hint="Sistemde aktif öğrenci kaydı"
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Akademisyen"
          value={String(academicians.length)}
          hint="Aktif akademik kadro"
          icon={UserCheck}
          tone="sky"
        />
        <StatCard
          label="Tanımlı Ders"
          value={String(courses.length)}
          hint="2026–2027 Güz dönemi"
          icon={BookOpen}
          tone="emerald"
        />
        <StatCard
          label="Yayında Duyuru"
          value={String(announcements.length)}
          hint={`${announcements.filter((item) => item.pinned).length} sabitlenmiş duyuru`}
          icon={Megaphone}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Hızlı işlemler
            </h2>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-start gap-2.5 rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_18px_36px_-28px_rgba(124,92,255,0.55)] dark:border-white/[0.07] dark:bg-[#0d0c1c]/75 dark:hover:border-brand-400/30"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${action.tile}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {action.title}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                        {action.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600"
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                Son kayıtlar
              </h2>
              <div className="flex items-center gap-2 text-[9px] font-semibold">
                <Link
                  to="/yonetim/ogrenci-kaydi"
                  className="text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300"
                >
                  Öğrenci ekle
                </Link>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden>
                  ·
                </span>
                <Link
                  to="/yonetim/akademisyen-kaydi"
                  className="text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300"
                >
                  Akademisyen ekle
                </Link>
              </div>
            </div>

            <ul className="mt-2 divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {recentRecords.map((record) => (
                <li key={record.key} className="flex items-center gap-2.5 py-2.5">
                  <Avatar name={record.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                      {record.name}
                    </p>
                    <p className="truncate text-[9px] text-slate-400 dark:text-slate-500">
                      {record.line}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-semibold ${record.tagClass}`}>
                    {record.tag}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                <Megaphone className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                Son duyurular
              </h2>
              <Link
                to="/yonetim/duyurular"
                className="text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300"
              >
                Tümü
              </Link>
            </div>

            <ul className="mt-2 divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {announcements.slice(0, 3).map((announcement) => (
                <li key={announcement.id} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={announcement.category} />
                    <AudienceBadge audience={announcement.audience} />
                    {announcement.pinned ? (
                      <Pin
                        className="h-3 w-3 text-amber-500 dark:text-amber-300"
                        aria-label="Sabitlenmiş duyuru"
                      />
                    ) : null}
                    <span className="ml-auto text-[8px] text-slate-400 dark:text-slate-500">
                      {dateFormatter.format(new Date(announcement.createdAt))}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                    {announcement.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {announcement.body}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              <CalendarDays className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
              Dönem özeti
            </h2>
            <dl className="mt-2.5 space-y-2 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Aktif dönem</dt>
                <dd className="font-semibold text-slate-700 dark:text-slate-200">2026–2027 Güz</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Ders kayıtları</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-300">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Açık
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Vize haftası</dt>
                <dd className="font-semibold text-slate-700 dark:text-slate-200">18–29 Kasım</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400 dark:text-slate-500">Sabitlenen duyuru</dt>
                <dd className="font-semibold text-slate-700 dark:text-slate-200">
                  {announcements.filter((item) => item.pinned).length}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
