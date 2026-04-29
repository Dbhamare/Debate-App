import { Box, ButtonBase } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getHomePath } from '../utils/navigation';

export default function AppLogoButton({ size = 42, alt = 'Debate Platform logo', sx }) {
  const navigate = useNavigate();

  return (
    <ButtonBase
      aria-label="Go to Debate Platform home"
      onClick={() => navigate(getHomePath())}
      sx={{
        borderRadius: 2,
        display: 'inline-flex',
        p: 0.35,
        ...sx,
      }}
    >
      <Box component="img" src="/app-logo.svg" alt={alt} sx={{ width: size, height: size, display: 'block' }} />
    </ButtonBase>
  );
}
