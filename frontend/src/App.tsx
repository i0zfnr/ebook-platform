import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { UploadPage } from './pages/UploadPage';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { ReaderPage } from './pages/ReaderPage';
import { AboutPage } from './pages/AboutPage';
import { AiTutorPage } from './pages/AiTutorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AnimatedBackground } from './components/common/AnimatedBackground';
import { CursorGlow } from './components/common/CursorGlow';
import { SmoothScroll } from './components/common/SmoothScroll';

function AppLayout() {
  const location = useLocation();
  const isReaderView = location.pathname.startsWith('/read/');
  const isAiTutorView = location.pathname === '/ai-tutor';
  const hideFooter = isReaderView || isAiTutorView;

  return (
    <SmoothScroll>
      <div className="relative flex min-h-screen flex-col font-sans antialiased selection:bg-violet-500 selection:text-white transition-colors duration-300">
        {/* Background & Cursor Effects */}
        {!isReaderView && <AnimatedBackground />}
        <CursorGlow />

        {!isReaderView && <Navbar />}
        <main className="relative z-10 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/ai-tutor" element={<AiTutorPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/book/:id" element={<BookDetailsPage />} />
            <Route path="/read/:id" element={<ReaderPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!hideFooter && <Footer />}
      </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}