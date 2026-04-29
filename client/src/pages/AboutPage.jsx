import { Box, Typography, Paper } from '@mui/material';

export default function AboutPage() {
  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Paper sx={{ p: 3, maxWidth: 700, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>About</Typography>
        <Typography>
          Debate Platform is an online tool designed for universities and colleges to facilitate engaging, structured, and interactive debate sessions. The platform aims to encourage participation, track engagement, and provide data-driven insights for both students and teachers.
        </Typography>
        <Typography>
          Creator: Darshan Chandravilas Bhamare
        </Typography>
      </Paper>
    </Box>
  );
}