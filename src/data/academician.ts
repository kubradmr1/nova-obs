import type { AcademicianCourse } from '@/types/academician';

export const ACADEMICIAN_COURSES: AcademicianCourse[] = [
  {
    code: 'BM201',
    name: 'Veri Yapıları ve Algoritmalar',
    term: '2026–2027 Güz',
    schedule: 'Pazartesi 09.00',
    room: 'D-204',
    credits: 4,
    ects: 6,
    roster: [
      { number: '2024001234', name: 'Elif Yılmaz', midterm: 88, final: 92 },
      { number: '2024001188', name: 'Kaan Demir', midterm: 72, final: 80 },
      { number: '2024001276', name: 'Derya Şahin', midterm: 66, final: 74 },
      { number: '2023001142', name: 'Mert Koç', midterm: 91, final: 95 },
      { number: '2023001088', name: 'Zeynep Arslan', midterm: 58, final: 62 },
      { number: '2024001210', name: 'Ece Yıldırım', midterm: 84, final: 88 },
      { number: '2023001176', name: 'Baran Aksoy', midterm: 45, final: 52 },
      { number: '2024001245', name: 'İpek Doğan', midterm: 79, final: 85 },
      { number: '2023001123', name: 'Alp Yalçın', midterm: 63, final: 70 },
      { number: '2024001268', name: 'Sude Kılıç', midterm: 95, final: 98 },
      { number: '2023001190', name: 'Ozan Şen', midterm: 52, final: 58 },
      { number: '2024001299', name: 'Nehir Ateş', midterm: 88, final: 84 },
    ],
  },
  {
    code: 'BM305',
    name: 'Yazılım Mimarisi',
    term: '2026–2027 Güz',
    schedule: 'Çarşamba 13.30',
    room: 'B-210',
    credits: 3,
    ects: 5,
    roster: [
      { number: '2023001044', name: 'Melis Kurt', midterm: 82, final: 90 },
      { number: '2023001067', name: 'Kerem Aslan', midterm: 74, final: 68 },
      { number: '2024001201', name: 'Aslı Çetin', midterm: 91, final: 94 },
      { number: '2023001099', name: 'Efe Polat', midterm: 65, final: 72 },
      { number: '2024001226', name: 'Defne Sarı', midterm: 86, final: 89 },
      { number: '2023001110', name: 'Yiğit Bulut', midterm: 57, final: 63 },
      { number: '2024001254', name: 'Zara Özkan', midterm: 78, final: 81 },
      { number: '2023001132', name: 'Arda Güneş', midterm: 69, final: 75 },
    ],
  },
];

export const ACADEMICIAN_AGENDA = [
  { time: '09.00', title: 'BM201 Veri Yapıları', location: 'D-204', kind: 'Ders' },
  { time: '13.30', title: 'BM305 Yazılım Mimarisi', location: 'B-210', kind: 'Ders' },
  { time: '15.00', title: 'Danışmanlık görüşmesi', location: 'Ofis D-310', kind: 'Görüşme' },
  { time: '16.30', title: 'Bölüm akademik toplantısı', location: 'Toplantı salonu', kind: 'Toplantı' },
] as const;
