import { Box, Link, Typography, Stack, IconButton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        mt: 0,
        py: 2.4,
        px: 2,
        bgcolor: isDark ? alpha("#06111e", 0.78) : alpha("#0f2e51", 0.86),
        color: "#fff",
        borderTop: `1px solid ${isDark ? alpha("#d7e7ff", 0.14) : alpha("#ffffff", 0.18)}`,
        backdropFilter: "blur(8px)",
      }}
      component="footer"
    >
      <Stack direction="row" spacing={{ xs: 2, md: 4 }} justifyContent="center" mb={1.1} flexWrap="wrap">
        <Link component={RouterLink} to="/about" color="inherit" underline="hover">About</Link>
        <Link component={RouterLink} to="/features" color="inherit" underline="hover">Features</Link>
        <Link component={RouterLink} to="/contact" color="inherit" underline="hover">Contact Us</Link>
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="center">
        <IconButton component="a" href="https://github.com/yourusername" target="_blank" color="inherit">
          <GitHubIcon />
        </IconButton>
        <IconButton component="a" href="https://twitter.com/yourusername" target="_blank" color="inherit">
          <TwitterIcon />
        </IconButton>
        <IconButton component="a" href="mailto:youremail@example.com" color="inherit">
          <EmailIcon />
        </IconButton>
      </Stack>
      <Typography variant="caption" align="center" display="block" mt={1}>
        &copy; {new Date().getFullYear()} Debate Sessions Platform
      </Typography>
    </Box>
  );
}
