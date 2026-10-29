import { Navigate, Route, Routes } from 'react-router-dom';
import { AcademicianLayout } from '@/layouts/AcademicianLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { LoginPage } from '@/pages/LoginPage';
import { AcademicianDashboardPage } from '@/pages/academician/DashboardPage';
import { GradeEntryPage } from '@/pages/academician/GradeEntryPage';
import { AcademicianMessagesPage } from '@/pages/academician/MessagesPage';
import { AcademicianRegistrationPage } from '@/pages/admin/AcademicianRegistrationPage';
import { AnnouncementsPage } from '@/pages/admin/AnnouncementsPage';
import { CourseDefinitionPage } from '@/pages/admin/CourseDefinitionPage';
import { AdminDashboardPage } from '@/pages/admin/DashboardPage';
import { StudentRegistrationPage } from '@/pages/admin/StudentRegistrationPage';
import { AccountPage } from '@/pages/student/AccountPage';
import { StudentAnnouncementsPage } from '@/pages/student/AnnouncementsPage';
import { AttendancePage } from '@/pages/student/AttendancePage';
import { CourseRegistrationPage } from '@/pages/student/CourseRegistrationPage';
import { DashboardPage } from '@/pages/student/DashboardPage';
import { ExamSchedulePage } from '@/pages/student/ExamSchedulePage';
import { StudentFormsPage } from '@/pages/student/FormsPage';
import { GpaSimulatorPage } from '@/pages/student/GpaSimulatorPage';
import { GradesPage } from '@/pages/student/GradesPage';
import { StudentMessagesPage } from '@/pages/student/MessagesPage';
import { TranscriptPage } from '@/pages/student/TranscriptPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/panel" element={<StudentLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="duyurular" element={<StudentAnnouncementsPage />} />
        <Route path="dersler" element={<GradesPage />} />
        <Route path="ders-kaydi" element={<CourseRegistrationPage />} />
        <Route path="sinavlar" element={<ExamSchedulePage />} />
        <Route path="gano" element={<GpaSimulatorPage />} />
        <Route path="devamsizlik" element={<AttendancePage />} />
        <Route path="transkript" element={<TranscriptPage />} />
        <Route path="mesajlar" element={<StudentMessagesPage />} />
        <Route path="formlar" element={<StudentFormsPage />} />
        <Route path="hesap" element={<AccountPage />} />
      </Route>
      <Route path="/hoca" element={<AcademicianLayout />}>
        <Route index element={<AcademicianDashboardPage />} />
        <Route path="not-girisi" element={<GradeEntryPage />} />
        <Route path="mesajlar" element={<AcademicianMessagesPage />} />
      </Route>
      <Route path="/yonetim" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="ogrenci-kaydi" element={<StudentRegistrationPage />} />
        <Route path="akademisyen-kaydi" element={<AcademicianRegistrationPage />} />
        <Route path="ders-tanimlama" element={<CourseDefinitionPage />} />
        <Route path="duyurular" element={<AnnouncementsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
