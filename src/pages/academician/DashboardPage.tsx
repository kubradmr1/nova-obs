import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  MessageSquare,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/student/StatCard';
import { ACADEMICIAN_AGENDA, ACADEMICIAN_COURSES } from '@/data/academician';
import { DEFAULT_ACADEMICIAN_ID, findAcademicianById, getAcademicianIdForSession } from '@/data/academicians';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging } from '@/hooks/useMessaging';
import type { AcademicianCourse, GradeMap } from '@/types/academician';
import { cx } from '@/utils/cx';
import { computeAverage, formatGrade, isPassing, resolveLetter } from '@/utils/grading';
import { loadGradebooks } from '@/utils/gradebook';

interface CourseStats {
  graded: number;
  missing: number;
  average: number;
  passed: number;
  passRate: number;
}

function getCourseStats(course: AcademicianCourse, gradeMap: GradeMap): CourseStats {
  let sum = 0;
  let graded = 0;
  let passed = 0;
  let missing = 0;

  for (const student of course.roster) {
    const entry = gradeMap[student.number];

    if (!entry || entry.midterm === null || entry.final === null) {
      missing += 1;
      continue;
    }

    const average = computeAverage(entry.midterm, entry.final);
    sum += average;
    graded += 1;

    if (isPassing(resolveLetter(average))) {
      passed += 1;
    }
  }

  return {
    graded,
    missing,
    average: graded > 0 ? sum / graded : 0,
    passed,
    passRate: graded > 0 ? (passed / graded) * 100 : 0,
  };
}

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
});

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? timeFormatter.format(date)
    : shortDateFormatter.format(date);
}

export function AcademicianDashboardPage() {
  const { session } = useAuth();
  const { chats } = useMessaging();
  const [gradebooks] = useState(() => loadGradebooks(ACADEMICIAN_COURSES));

  const academicianId = session
    ? getAcademicianIdForSession(session)
    : DEFAULT_ACADEMICIAN_ID;
  const profile = findAcademicianById(academicianId) ?? findAcademicianById(DEFAULT_ACADEMICIAN_ID);

  const courseStats = ACADEMICIAN_COURSES.map((course) => ({
    course,
    stats: getCourseStats(course, gradebooks[course.code] ?? {}),
  }));

  const totalStudents = ACADEMICIAN_COURSES.reduce(
    (total, course) => total + course.roster.length,
    0,
  );
  const gradedTotal = courseStats.reduce((total, item) => total + item.stats.graded, 0);
  const passedTotal = courseStats.reduce((total, item) => total + item.stats.passed, 0);
  const passRate = gradedTotal > 0 ? (passedTotal / gradedTotal) * 100 : 0;

  const recentChats = chats
    .filter((chat) => chat.academicianId === academicianId)
    .sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1];
      const lastB = b.messages[b.messages.length - 1];
      return (
        (lastB ? new Date(lastB.sentAt).getTime() : 0) -
        (lastA ? new Date(lastA.sentAt).getTime() : 0)
      );
    })
    .slice(0, 3);

  const unread = chats
    .filter((chat) => chat.academicianId === academicianId)
    .reduce((total, chat) => total + chat.unreadForAcademician, 0);

  const todayLabel = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Akademisyen Paneli"
        title={`Merhaba, ${profile?.name ?? 'Mert Hocam'}`}
        description="Derslerini, not girişlerini ve öğrenci mesajlarını tek ekrandan yönet. Bugünün programı ve bekleyen işler aşağıda."
        actions={
          <Link
            to="/hoca/not-girisi"
            className="group inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(110deg,#7c5cff_0%,#5f6bff_48%,#a855f7_100%)] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_16px_34px_-18px_rgba(124,92,255,0.9)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Not girişine git
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktif Ders"
          value={String(ACADEMICIAN_COURSES.length)}
          hint="2026–2027 Güz dönemi"
          icon={BookOpen}
          tone="brand"
        />
        <StatCard
          label="Toplam Öğrenci"
          value={String(totalStudents)}
          hint="Tüm derslerindeki kayıtlı öğrenci"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="Başarı Oranı"
          value={String(Math.round(passRate))}
          suffix="%"
          hint="Güncel not girişlerine göre"
          icon={BadgeCheck}
          tone="emerald"
        />
        <StatCard
          label="Okunmamış Mesaj"
          value={String(unread)}
          hint={unread > 0 ? 'Yanıt bekleyen öğrenci mesajı' : 'Tüm mesajlar okundu'}
          icon={MessageSquare}
          tone={unread > 0 ? 'rose' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.45fr_1fr]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Derslerim
            </h2>
            <span className="text-[9.5px] text-slate-400 dark:text-slate-500">
              {ACADEMICIAN_COURSES[0]?.term ?? '2026–2027 Güz'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {courseStats.map(({ course, stats }) => (
              <Card key={course.code} className="group flex flex-col overflow-hidden p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] px-2 font-display text-[11px] font-bold tracking-[0.04em] text-white">
                    {course.code}
                  </span>
                  <span className="rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2 py-0.5 text-[8.5px] font-semibold text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Aktif
                  </span>
                </div>

                <h3 className="mt-2.5 font-display text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                  {course.name}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {course.schedule}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {course.room}
                  </span>
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                      Öğrenci
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                      {course.roster.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                      Ortalama
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                      {formatGrade(stats.average)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                      Geçen
                    </p>
                    <p className="mt-0.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-300">
                      {stats.passed}
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                        /{stats.graded}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 dark:text-slate-500">
                    <span>Başarı oranı</span>
                    <span>{Math.round(stats.passRate)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#10b981)]"
                      style={{ width: `${Math.round(stats.passRate)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span
                    className={cx(
                      'text-[9px] font-medium',
                      stats.missing > 0
                        ? 'text-amber-600 dark:text-amber-300'
                        : 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {stats.missing > 0 ? `${stats.missing} not eksik` : 'Tüm notlar girildi'}
                  </span>
                  <Link
                    to="/hoca/not-girisi"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    Notları düzenle
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                <CalendarDays className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                Bugünün ajandası
              </h2>
              <span className="text-[9px] capitalize text-slate-400 dark:text-slate-500">
                {todayLabel}
              </span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {ACADEMICIAN_AGENDA.map((item) => (
                <li key={`${item.time}-${item.title}`} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-9 shrink-0 rounded-lg bg-brand-500/10 py-0.5 text-center text-[9px] font-bold tabular-nums text-brand-600 dark:text-brand-300">
                    {item.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                      {item.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500">
                      <MapPin className="h-2.5 w-2.5" aria-hidden />
                      {item.location}
                      <span aria-hidden>·</span>
                      {item.kind}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                <MessageSquare className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                Son mesajlar
              </h2>
              <Link
                to="/hoca/mesajlar"
                className="text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300"
              >
                Tümü
              </Link>
            </div>

            <div className="mt-2 divide-y divide-slate-200/60 dark:divide-white/[0.06]">
              {recentChats.length === 0 ? (
                <p className="py-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
                  Henüz öğrenci mesajı yok.
                </p>
              ) : (
                recentChats.map((chat) => {
                  const last = chat.messages[chat.messages.length - 1];

                  return (
                    <Link
                      key={chat.id}
                      to="/hoca/mesajlar"
                      className="flex items-center gap-2.5 py-2.5 transition-colors hover:opacity-80"
                    >
                      <Avatar name={chat.studentName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                            {chat.studentName}
                          </p>
                          {last ? (
                            <span className="shrink-0 text-[8px] text-slate-400 dark:text-slate-500">
                              {formatMessageTime(last.sentAt)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[9.5px] text-slate-400 dark:text-slate-500">
                          {chat.courseCode} · {last?.text ?? 'Henüz mesaj yok'}
                        </p>
                      </div>
                      {chat.unreadForAcademician > 0 ? (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-label="Okunmamış mesaj" />
                      ) : null}
                    </Link>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
