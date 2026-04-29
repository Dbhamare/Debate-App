import './App.css';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme, alpha } from '@mui/material/styles';
import AppRoutes from './routes';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { BrowserRouter } from "react-router-dom";
import { useEffect, useMemo, useState } from 'react';

const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.25;

function clampScale(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, n));
}

function MainApp({ mode, onToggleMode, fontScale, onFontScaleChange }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  const hideNavbar = [
    "/", "/login", "/register", "/forgot-password", "/reset-password", "/admin/login",
    "/about", "/features", "/contact"
  ].some(path => location.pathname === path || location.pathname.startsWith("/public/debate"));

  return (
    <>
      {!hideNavbar && (
        <Navbar
          user={user}
          mode={mode}
          onToggleMode={onToggleMode}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
        />
      )}
      <AppRoutes
        mode={mode}
        onToggleMode={onToggleMode}
        fontScale={fontScale}
        onFontScaleChange={onFontScaleChange}
      />
    </>
  );
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('ui_mode') || 'light');
  const [fontScale, setFontScale] = useState(() => clampScale(localStorage.getItem('ui_font_scale') || 1));

  useEffect(() => {
    localStorage.setItem('ui_mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-ui-mode', mode);
    document.body.setAttribute('data-ui-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('ui_font_scale', String(fontScale));
  }, [fontScale]);

  const theme = useMemo(() => {
    const isDark = mode === 'dark';
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: { main: '#1f78d1' },
        secondary: { main: '#ef523b' },
        background: {
          default: 'transparent',
          paper: isDark ? alpha('#0f1a2a', 0.74) : alpha('#ffffff', 0.82),
        },
      },
      shape: { borderRadius: 14 },
      typography: {
        fontFamily: '"Manrope", "Segoe UI", sans-serif',
        h1: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        h2: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        h3: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        h4: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        h5: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        h6: { fontFamily: '"Space Grotesk", "Manrope", sans-serif' },
        fontSize: Math.round(14 * clampScale(fontScale)),
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            ':root': {
              colorScheme: isDark ? 'dark' : 'light',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              border: `1px solid ${isDark ? alpha('#d7e7ff', 0.16) : alpha('#0d2442', 0.08)}`,
              backdropFilter: 'blur(10px)',
              boxShadow: isDark
                ? `0 10px 32px ${alpha('#05080d', 0.45)}`
                : `0 10px 30px ${alpha('#0d2442', 0.12)}`,
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backdropFilter: 'blur(10px)',
              boxShadow: isDark
                ? `0 8px 24px ${alpha('#03060b', 0.44)}`
                : `0 8px 24px ${alpha('#0e2544', 0.18)}`,
              borderBottom: `1px solid ${isDark ? alpha('#d7e7ff', 0.15) : alpha('#0d2442', 0.08)}`,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: 0.15,
            },
            contained: {
              boxShadow: isDark
                ? `0 6px 20px ${alpha('#0b121f', 0.4)}`
                : `0 6px 18px ${alpha('#0f4a89', 0.22)}`,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundColor: isDark ? alpha('#081120', 0.42) : alpha('#ffffff', 0.7),
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              fontWeight: 600,
            },
          },
        },
      },
    });
  }, [mode, fontScale]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <MainApp
          mode={mode}
          onToggleMode={() => setMode((p) => (p === 'dark' ? 'light' : 'dark'))}
          fontScale={fontScale}
          onFontScaleChange={(next) => setFontScale(clampScale(next))}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}
