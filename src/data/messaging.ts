import type { Chat, ChatMessage } from '@/types/messaging';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function message(
  id: string,
  from: ChatMessage['from'],
  text: string,
  hours: number,
): ChatMessage {
  return { id, from, text, sentAt: hoursAgo(hours) };
}

export function createSeedChats(): Chat[] {
  return [
    {
      id: 'chat-elif-mert-bm201',
      studentId: '2024001234',
      studentName: 'Elif Yılmaz',
      studentNumber: '2024001234',
      academicianId: 'mert',
      courseCode: 'BM201',
      courseName: 'Veri Yapıları ve Algoritmalar',
      unreadForStudent: 0,
      unreadForAcademician: 1,
      messages: [
        message(
          'seed-1',
          'student',
          'Hocam merhaba, Veri Yapıları dönem projesinde hash tablosu yerine ağaç yapısı kullanabilir miyim?',
          30,
        ),
        message(
          'seed-2',
          'academician',
          'Merhaba Elif, proje kapsamında ikisi de kabul edilebilir. Karşılaştırmalı bir analiz eklemeni öneririm.',
          28,
        ),
        message(
          'seed-3',
          'student',
          'Teşekkürler hocam, rapora karmaşıklık karşılaştırmasını da ekliyorum.',
          3,
        ),
      ],
    },
    {
      id: 'chat-elif-cafer-bm209',
      studentId: '2024001234',
      studentName: 'Elif Yılmaz',
      studentNumber: '2024001234',
      academicianId: 'cafer',
      courseCode: 'BM209',
      courseName: 'Bulut Bilişim Temelleri',
      unreadForStudent: 0,
      unreadForAcademician: 0,
      messages: [
        message(
          'seed-15',
          'student',
          'Hocam merhaba, Bulut Laboratuvarı erişimim bu dönem aktif mi?',
          52,
        ),
        message(
          'seed-16',
          'academician',
          'Merhaba Elif, erişimin aktif. Sanal makine kotan 4 vCPU / 8 GB olarak tanımlandı.',
          50,
        ),
        message(
          'seed-17',
          'student',
          'Harika, teşekkürler hocam. Danışmanlık için salı 14.00 uygun mu?',
          6,
        ),
        message('seed-18', 'academician', 'Salı 14.00–16.00 ofis saatim; V-204’te görüşebiliriz.', 2),
      ],
    },
    {
      id: 'chat-elif-selin-bm203',
      studentId: '2024001234',
      studentName: 'Elif Yılmaz',
      studentNumber: '2024001234',
      academicianId: 'selin',
      courseCode: 'BM203',
      courseName: 'İşletim Sistemleri',
      unreadForStudent: 1,
      unreadForAcademician: 0,
      messages: [
        message(
          'seed-4',
          'student',
          'Hocam işletim sistemleri laboratuvarında süreç senkronizasyonu konusunu tekrar edebilir miyiz?',
          48,
        ),
        message(
          'seed-5',
          'academician',
          'Tabii Elif, Salı günü dersten sonra 15 dakika ayırabiliriz. Ofisim D-306.',
          26,
        ),
      ],
    },
    {
      id: 'chat-elif-ayse-bm207',
      studentId: '2024001234',
      studentName: 'Elif Yılmaz',
      studentNumber: '2024001234',
      academicianId: 'ayse',
      courseCode: 'BM207',
      courseName: 'Bilgisayar Ağları',
      unreadForStudent: 0,
      unreadForAcademician: 0,
      messages: [
        message(
          'seed-6',
          'student',
          'Hocam merhaba, Bilgisayar Ağları dersinde devam durumum sınırda görünüyor. Bir sonraki derse katılmam yeterli olur mu?',
          74,
        ),
        message(
          'seed-7',
          'academician',
          'Merhaba Elif, devam durumun risk sınırında. Kalan derslerin tamamına katılmanı öneririm.',
          70,
        ),
        message('seed-8', 'student', 'Anladım hocam, teşekkürler.', 69),
      ],
    },
    {
      id: 'chat-kaan-mert-bm201',
      studentId: '2024001188',
      studentName: 'Kaan Demir',
      studentNumber: '2024001188',
      academicianId: 'mert',
      courseCode: 'BM201',
      courseName: 'Veri Yapıları ve Algoritmalar',
      unreadForStudent: 0,
      unreadForAcademician: 1,
      messages: [
        message(
          'seed-9',
          'student',
          'Hocam vize 2 için konu kapsamı ders notlarının tamamı mı?',
          20,
        ),
        message(
          'seed-10',
          'academician',
          'İlk 5 hafta dahil, sıralama algoritmaları hariç. Ders notlarındaki örnek sorulara çalışabilirsin.',
          19,
        ),
        message('seed-11', 'student', 'Anladım hocam, teşekkürler.', 5),
      ],
    },
    {
      id: 'chat-derya-mert-bm201',
      studentId: '2024001276',
      studentName: 'Derya Şahin',
      studentNumber: '2024001276',
      academicianId: 'mert',
      courseCode: 'BM201',
      courseName: 'Veri Yapıları ve Algoritmalar',
      unreadForStudent: 0,
      unreadForAcademician: 0,
      messages: [
        message(
          'seed-12',
          'student',
          'Hocam proje teslim tarihine iki gün kaldı, repo bağlantısını nasıl ileteceğim?',
          12,
        ),
        message(
          'seed-13',
          'academician',
          'Sisteme tek dosya olarak yükleyebilirsin. Repo bağlantısını raporun sonuna eklemen yeterli.',
          11,
        ),
        message('seed-14', 'student', 'Tamamdır, teşekkürler hocam.', 9),
      ],
    },
  ];
}
