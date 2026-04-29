import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

export default function FeaturesPage() {
  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Paper sx={{ p: 3, maxWidth: 700, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>Features</Typography>
        <List>
          <ListItem><ListItemText primary="Real-time debate participation" /></ListItem>
          <ListItem><ListItemText primary="QR code, link, or access code to join" /></ListItem>
          <ListItem><ListItemText primary="Secure login for students and instructors" /></ListItem>
          <ListItem><ListItemText primary="Gamification: points, badges, and streaks" /></ListItem>
          <ListItem><ListItemText primary="Analytics and sentiment analysis for instructors" /></ListItem>
          <ListItem><ListItemText primary="Anonymous and breakout room options" /></ListItem>
          <ListItem><ListItemText primary="Mobile and desktop friendly" /></ListItem>
        </List>
      </Paper>
    </Box>
  );
}