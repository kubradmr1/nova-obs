import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from '@/components/auth/RequireRole';
import { getHomePath } from '@/config/roles';
import { useAuth } from '@/hooks/useAuth';
import { AcademicianLayout } from '@/layouts/AcademicianLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { LoginPage } from '@/pages/LoginPage';
import { AcademicianDashboardPage } from '@/pages/academician/DashboardPage';
import { GradeEntryPage } from '@/pages/academician/GradeEntryPage';
import { AcademicianMessagesPage } from '@/pages/academician/MessagesPage';
import { QrAttendancePage as AcademicianQrAttendancePage } from '@/pages/academician/QrAttendancePage';
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
import { QrAttendancePage as StudentQrAttendancePage } from '@/pages/student/QrAttendancePage';
import { TranscriptPage } from '@/pages/student/TranscriptPage';

function HomeRedirect() {
  const { session } = useAuth();
  return <Navigate to={session ? getHomePath(session.role) : '/'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/yetkisiz" element={<AccessDeniedPage />} />

      <Route
        path="/panel"
        element={
          <RequireRole role="student">
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="duyurular" element={<StudentAnnouncementsPage />} />
        <Route path="dersler" element={<GradesPage />} />
        <Route path="ders-kaydi" element={<CourseRegistrationPage />} />
        <Route path="sinavlar" element={<ExamSchedulePage />} />
        <Route path="gano" element={<GpaSimulatorPage />} />
        <Route path="yoklama" element={<StudentQrAttendancePage />} />
        <Route path="devamsizlik" element={<AttendancePage />} />
        <Route path="transkript" element={<TranscriptPage />} />
        <Route path="mesajlar" element={<StudentMessagesPage />} />
        <Route path="formlar" element={<StudentFormsPage />} />
        <Route path="hesap" element={<AccountPage />} />
      </Route>

      <Route
        path="/hoca"
        element={
          <RequireRole role="academic">
            <AcademicianLayout />
          </RequireRole>
        }
      >
        <Route index element={<AcademicianDashboardPage />} />
        <Route path="not-girisi" element={<GradeEntryPage />} />
        <Route path="yoklama" element={<AcademicianQrAttendancePage />} />
        <Route path="mesajlar" element={<AcademicianMessagesPage />} />
      </Route>

      <Route
        path="/yonetim"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="ogrenci-kaydi" element={<StudentRegistrationPage />} />
        <Route path="akademisyen-kaydi" element={<AcademicianRegistrationPage />} />
        <Route path="ders-tanimlama" element={<CourseDefinitionPage />} />
        <Route path="duyurular" element={<AnnouncementsPage />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
