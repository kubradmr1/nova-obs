export const messagingTr = {
  'msg.error.permissionRead':
    'Bu görüşmelere erişim yetkin yok. supabase/schema.sql içindeki RLS politikalarını kontrol et.',
  'msg.error.tablesMissing':
    'Mesajlaşma tabloları bulunamadı. Supabase üzerinde supabase/schema.sql dosyasını çalıştır.',
  'msg.error.network':
    'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip sayfayı yenile.',
  'msg.error.loadFailed': 'Mesajlar yüklenemedi. Sayfayı yenileyip tekrar dene.',
  'msg.error.sendPermission': 'Bu görüşmede mesaj gönderme yetkin yok.',
  'msg.error.connect': 'Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.',
  'msg.error.length': 'Mesaj 1–2000 karakter arasında olmalı.',
  'msg.error.sendFailed': 'Mesaj gönderilemedi. Lütfen tekrar dene.',
  'msg.error.notConfigured': 'Supabase yapılandırılmadı.',
  'msg.error.academicianNotFound': 'Seçilen akademisyen sistemde tanımlı değil.',
  'msg.error.sessionEmailMissing': 'Oturum e-posta bilgisi eksik. Lütfen yeniden giriş yap.',
  'msg.error.conversationFailed': 'Görüşme başlatılamadı. Lütfen tekrar dene.',
  'msg.student.eyebrow': 'Danışman İletişimi',
  'msg.student.title': 'Mesajlarım',
  'msg.student.description':
    'Dersin akademisyenini seç, konuşma geçmişini gör ve yeni mesaj gönder. Akademisyenlerin yanıtları bu ekrana anında düşer.',
  'msg.academic.eyebrow': 'Öğrenci İletişimi',
  'msg.academic.description':
    'Öğrencilerden gelen soruları buradan yanıtla. Okunmamış mesajlar bildirim olarak işaretlenir; görüşmeyi açtığında otomatik okundu sayılır.',
  'msg.connection': 'Mesajlaşma bağlantısı',
  'msg.newChat': 'Yeni görüşme',
  'msg.search.placeholder': 'Hoca veya ders ara…',
  'msg.search.label': 'Görüşme ara',
  'msg.search.academic.placeholder': 'Öğrenci veya ders ara…',
  'msg.search.academic.label': 'Mesaj kutusunda ara',
  'msg.list.student': 'Görüşmeler',
  'msg.list.academic': 'Gelen kutusu',
  'msg.loading.student': 'Görüşmeler yükleniyor…',
  'msg.loading.academic': 'Gelen kutusu yükleniyor…',
  'msg.empty.student.title': 'Görüşme bulunamadı',
  'msg.empty.student.hint':
    'Aramayı temizleyebilir veya yeni bir görüşme başlatabilirsin.',
  'msg.empty.academic.title': 'Mesaj bulunamadı',
  'msg.empty.academic.unread':
    'Okunmamış mesaj kalmadı. Tüm gelen kutusuna göz atabilirsin.',
  'msg.empty.academic.search': 'Arama kriterlerine uygun görüşme yok.',
  'msg.fallback.academician': 'Akademisyen',
  'msg.preview.you': 'Sen',
  'msg.preview.empty': 'Henüz mesaj yok',
  'msg.select.student.title': 'Bir görüşme seç',
  'msg.select.student.hint':
    'Soldaki listeden bir hocayla konuşmaya devam edebilir veya yeni bir görüşme başlatabilirsin.',
  'msg.select.academic.title': 'Bir öğrenci mesajı seç',
  'msg.select.academic.hint':
    'Soldaki gelen kutusundan bir görüşme açarak öğrenciye yanıt verebilirsin.',
  'msg.start.failed': 'Görüşme başlatılamadı, tekrar dene.',
  'msg.newChat.close': 'Yeni görüşme penceresini kapat',
  'msg.newChat.hint': 'Bir ders seç, dersin akademisyeniyle sohbeti başlat.',
  'msg.newChat.ongoing': 'Devam ediyor',
  'msg.newChat.new': 'Yeni',
  'msg.markAllRead': 'Tümünü okundu işaretle',
  'msg.inbox.new': '{count} yeni',
  'msg.inbox.allRead': 'Tümü okundu',
  'msg.filter.all': 'Tümü ({count})',
  'msg.filter.unread': 'Okunmamış ({count})',
  'msg.thread.back': 'Görüşme listesine dön',
  'msg.thread.log': '{name} ile sohbet',
  'msg.thread.emptyTitle': 'Bu sohbet henüz başlamadı',
  'msg.thread.emptyStudent':
    'İlk mesajı yazarak hocanla iletişime geçebilirsin.',
  'msg.thread.emptyAcademic':
    'Öğrenciye ilk mesajı sen yazarak görüşmeyi başlatabilirsin.',
  'msg.thread.placeholder': 'Mesajını yaz…',
  'msg.thread.inputLabel': 'Mesaj yaz',
  'msg.thread.send': 'Mesajı gönder',
  'msg.thread.sendFailed': 'Mesaj gönderilemedi, tekrar dene.',
  'msg.thread.hintRetention':
    'Enter ile gönder · Mesajlar 7 gün sonra otomatik silinir',
  'msg.thread.hint': 'Enter ile gönder · Shift + Enter yeni satır',
  'msg.thread.yesterday': 'Dün',
  'msg.quick.student.thanks': 'Teşekkürler hocam!',
  'msg.quick.student.meet': 'Müsait olduğunuzda görüşebilir miyiz?',
  'msg.quick.student.project': 'Proje teslimi hakkında bir sorum var.',
  'msg.quick.academic.received':
    'Merhaba, mesajını aldım. En kısa sürede dönüş yapacağım.',
  'msg.quick.academic.office':
    'Görüşme saatim Salı 14.00–16.00, ofisime uğrayabilirsin.',
  'msg.quick.academic.grades': 'Notlarını kontrol ettim, teşekkürler.',
} as const;

export const messagingEn: Record<string, string> = {
  'msg.error.permissionRead':
    'You do not have access to these conversations. Check the RLS policies in supabase/schema.sql.',
  'msg.error.tablesMissing':
    'Messaging tables were not found. Run supabase/schema.sql on your Supabase project.',
  'msg.error.network': 'Could not reach the server. Check your connection and refresh the page.',
  'msg.error.loadFailed': 'Messages could not be loaded. Refresh the page and try again.',
  'msg.error.sendPermission': 'You do not have permission to send messages in this conversation.',
  'msg.error.connect': 'Could not connect. Check your connection and try again.',
  'msg.error.length': 'A message must be between 1 and 2000 characters.',
  'msg.error.sendFailed': 'The message could not be sent. Please try again.',
  'msg.error.notConfigured': 'Supabase is not configured.',
  'msg.error.academicianNotFound': 'The selected academician is not defined in the system.',
  'msg.error.sessionEmailMissing': 'Your session has no email address. Please sign in again.',
  'msg.error.conversationFailed': 'The conversation could not be started. Please try again.',
  'msg.student.eyebrow': 'Advisor Communication',
  'msg.student.title': 'My Messages',
  'msg.student.description':
    'Choose your course instructor, review the conversation history and send a new message. Instructor replies appear on this screen instantly.',
  'msg.academic.eyebrow': 'Student Communication',
  'msg.academic.description':
    'Answer questions from your students here. Unread messages are flagged; opening a conversation marks it as read automatically.',
  'msg.connection': 'Messaging connection',
  'msg.newChat': 'New conversation',
  'msg.search.placeholder': 'Search instructor or course…',
  'msg.search.label': 'Search conversations',
  'msg.search.academic.placeholder': 'Search student or course…',
  'msg.search.academic.label': 'Search inbox',
  'msg.list.student': 'Conversations',
  'msg.list.academic': 'Inbox',
  'msg.loading.student': 'Loading conversations…',
  'msg.loading.academic': 'Loading inbox…',
  'msg.empty.student.title': 'No conversations found',
  'msg.empty.student.hint':
    'You can clear the search or start a new conversation.',
  'msg.empty.academic.title': 'No messages found',
  'msg.empty.academic.unread':
    'No unread messages left. You can browse the full inbox.',
  'msg.empty.academic.search': 'No conversations match your search criteria.',
  'msg.fallback.academician': 'Instructor',
  'msg.preview.you': 'You',
  'msg.preview.empty': 'No messages yet',
  'msg.select.student.title': 'Select a conversation',
  'msg.select.student.hint':
    'Continue chatting with an instructor from the list on the left, or start a new conversation.',
  'msg.select.academic.title': 'Select a student message',
  'msg.select.academic.hint':
    'Open a conversation from the inbox on the left to reply to a student.',
  'msg.start.failed': 'Could not start the conversation, please try again.',
  'msg.newChat.close': 'Close the new conversation window',
  'msg.newChat.hint': 'Choose a course to start a chat with its instructor.',
  'msg.newChat.ongoing': 'Ongoing',
  'msg.newChat.new': 'New',
  'msg.markAllRead': 'Mark all as read',
  'msg.inbox.new': '{count} new',
  'msg.inbox.allRead': 'All read',
  'msg.filter.all': 'All ({count})',
  'msg.filter.unread': 'Unread ({count})',
  'msg.thread.back': 'Back to conversation list',
  'msg.thread.log': 'Chat with {name}',
  'msg.thread.emptyTitle': 'This conversation has not started yet',
  'msg.thread.emptyStudent':
    'Write the first message to get in touch with your instructor.',
  'msg.thread.emptyAcademic':
    'Start the conversation by writing the first message to the student.',
  'msg.thread.placeholder': 'Write your message…',
  'msg.thread.inputLabel': 'Write a message',
  'msg.thread.send': 'Send message',
  'msg.thread.sendFailed': 'Could not send the message, please try again.',
  'msg.thread.hintRetention':
    'Press Enter to send · Messages are deleted automatically after 7 days',
  'msg.thread.hint': 'Press Enter to send · Shift + Enter for a new line',
  'msg.thread.yesterday': 'Yesterday',
  'msg.quick.student.thanks': 'Thank you, professor!',
  'msg.quick.student.meet': 'Could we meet when you are available?',
  'msg.quick.student.project':
    'I have a question about the project submission.',
  'msg.quick.academic.received':
    'Hello, I received your message. I will get back to you as soon as possible.',
  'msg.quick.academic.office':
    'My office hours are Tuesday 14:00–16:00; feel free to stop by.',
  'msg.quick.academic.grades': 'I reviewed your grades, thank you.',
};
