import {
  AppBar,
  Toolbar,
  Button,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  IconButton,
  Drawer,
  Stack,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import { getHomePath } from '../utils/navigation';

const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.25;

export default function Navbar({
  user,
  mode = 'light',
  onToggleMode,
  fontScale = 1,
  onFontScaleChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  const joincode = useMemo(() => {
    const m = location.pathname.match(/^\/debate\/([^/]+)/);
    return m ? m[1] : null;
  }, [location.pathname]);

  const [q, setQ] = useState('');
  const [scope, setScope] = useState(joincode ? 'chat' : 'debates');
  const [mobileOpen, setMobileOpen] = useState(false);

  const adjustFontScale = (delta) => {
    if (!onFontScaleChange) return;
    const next = Number((fontScale + delta).toFixed(2));
    onFontScaleChange(Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, next)));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    if (scope === 'chat' && joincode) {
      navigate(`/search?q=${encodeURIComponent(query)}&scope=chat&joincode=${encodeURIComponent(joincode)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}&scope=debates`);
    }
    setQ('');
    setMobileOpen(false);
  };

  const searchForm = (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        gap: 1,
        width: '100%',
        maxWidth: isMobile ? '100%' : 780,
        p: 0.5,
        borderRadius: 3,
        border: `1px solid ${isDark ? alpha('#d8e8ff', 0.18) : alpha('#10335a', 0.12)}`,
        bgcolor: isDark ? alpha('#0a1728', 0.55) : alpha('#ffffff', 0.66),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Select
        size="small"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        sx={{
          minWidth: 130,
          '& .MuiOutlinedInput-notchedOutline': { border: 0 },
          bgcolor: isDark ? alpha('#091526', 0.65) : alpha('#ffffff', 0.76),
          borderRadius: 2,
        }}
      >
        <MenuItem value="debates">Debates</MenuItem>
        {joincode && <MenuItem value="chat">This chat</MenuItem>}
      </Select>
      <TextField
        fullWidth
        size="small"
        sx={{
          bgcolor: isDark ? alpha('#091526', 0.65) : alpha('#ffffff', 0.76),
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': { border: 0 },
        }}
        placeholder={scope === 'chat' ? 'Search in this chat...' : 'Search debates by title...'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Button type="submit" variant="contained" sx={{ px: 2.4 }}>
        Search
      </Button>
    </Box>
  );

  const uiControls = (
    <Stack
      direction="row"
      spacing={0.25}
      alignItems="center"
      sx={{
        p: 0.4,
        borderRadius: 99,
        border: `1px solid ${isDark ? alpha('#d8e8ff', 0.18) : alpha('#10335a', 0.12)}`,
        bgcolor: isDark ? alpha('#0a1728', 0.55) : alpha('#ffffff', 0.66),
      }}
    >
      <IconButton
        color="inherit"
        onClick={onToggleMode}
        aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
      </IconButton>
      <Button
        color="inherit"
        size="small"
        onClick={() => adjustFontScale(-0.05)}
        disabled={fontScale <= MIN_FONT_SCALE}
      >
        A-
      </Button>
      <Button
        color="inherit"
        size="small"
        onClick={() => adjustFontScale(0.05)}
        disabled={fontScale >= MAX_FONT_SCALE}
      >
        A+
      </Button>
    </Stack>
  );

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: isDark ? alpha('#06111e', 0.82) : alpha('#f4f9ff', 0.8),
        color: isDark ? '#dce9f8' : '#143056',
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 68, md: 72 }, px: { xs: 1.5, md: 2.5 } }}>
        <Button
          color="inherit"
          sx={{
            whiteSpace: 'nowrap',
            textTransform: 'none',
            fontSize: { xs: '1rem', md: '1.1rem' },
            fontWeight: 700,
            p: 0.8,
            minWidth: 0,
            gap: 1,
            borderRadius: 99,
          }}
          onClick={() => navigate(getHomePath(user))}
        >
          <Box
            component="img"
            src="/app-logo.svg"
            alt=""
            aria-hidden
            sx={{ width: 22, height: 22, display: 'block' }}
          />
          Debate Platform
        </Button>

        {!isMobile && (
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            {searchForm}
          </Box>
        )}

        {!isMobile && (
          <Box sx={{ ml: 'auto', mr: 1 }}>
            {uiControls}
          </Box>
        )}

        {!isMobile && user && (
          <>
            <Button color="inherit" sx={{ mr: 1.5, textTransform: 'none' }} onClick={() => navigate('/profile')}>
              {user.name}
            </Button>
            <Button
              color="inherit"
              onClick={() => {
                localStorage.clear();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </>
        )}

        {isMobile && (
          <Box sx={{ ml: 'auto' }}>
            <IconButton color="inherit" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 320, p: 2.2 }}>
          <Stack spacing={2}>
            {searchForm}
            {uiControls}
            {user && (
              <>
                <Button variant="outlined" onClick={() => { setMobileOpen(false); navigate('/profile'); }}>
                  {user.name}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => {
                    localStorage.clear();
                    setMobileOpen(false);
                    navigate('/');
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}
