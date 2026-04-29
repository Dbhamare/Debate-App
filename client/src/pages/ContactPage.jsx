import { Box, Typography, Paper, Link } from '@mui/material';

export default function ContactPage() {
  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Paper sx={{ p: 3, maxWidth: 700, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>Contact Us</Typography>
        <Typography>
          For support, feature requests, or partnership inquiries, please contact us at:<br /><br />
          <b>Email:</b> <Link href="mailto:support@debateplatform.com">support@debateplatform.com</Link><br />
          <b>LinkedIn:</b> <Link href="https://www.linkedin.com" target="_blank" rel="noopener">Debate Platform</Link><br />
          <b>Twitter:</b> <Link href="https://twitter.com" target="_blank" rel="noopener">@DebatePlatform</Link>
        </Typography>
      </Paper>
    </Box>
  );
}