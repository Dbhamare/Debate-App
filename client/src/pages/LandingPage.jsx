import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Stack, Container, Grid, CardActionArea, Chip, IconButton } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Footer from "../components/Footer";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import AppLogoButton from "../components/AppLogoButton";

const MIN_FONT_SCALE = 0.9;
const MAX_FONT_SCALE = 1.25;

export default function LandingPage({
  mode = "light",
  onToggleMode,
  fontScale = 1,
  onFontScaleChange,
}) {
  const [debates, setDebates] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    api.get("/debates/public").then(res => setDebates(res.data));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 4, md: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Stack
              direction="row"
              spacing={0.4}
              alignItems="center"
              sx={{
                p: 0.45,
                borderRadius: 99,
                border: `1px solid ${isDark ? alpha("#d8e8ff", 0.18) : alpha("#10335a", 0.12)}`,
                bgcolor: isDark ? alpha("#0a1728", 0.55) : alpha("#ffffff", 0.66),
              }}
            >
              <IconButton
                color="inherit"
                onClick={onToggleMode}
                aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {mode === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
              </IconButton>
              <Button
                color="inherit"
                size="small"
                onClick={() => onFontScaleChange?.(Number((fontScale - 0.05).toFixed(2)))}
                disabled={!onFontScaleChange || fontScale <= MIN_FONT_SCALE}
              >
                A-
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={() => onFontScaleChange?.(Number((fontScale + 0.05).toFixed(2)))}
                disabled={!onFontScaleChange || fontScale >= MAX_FONT_SCALE}
              >
                A+
              </Button>
            </Stack>
          </Box>

          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              textAlign: "center",
              bgcolor: isDark ? alpha("#0b1727", 0.76) : alpha("#ffffff", 0.8),
              mb: 4,
            }}
          >
            <Chip
              label="Live Debates, Better Conversations"
              color="primary"
              variant={isDark ? "outlined" : "filled"}
              sx={{ mb: 2.5 }}
            />
            <AppLogoButton size={72} alt="Debate App Logo" />
            <Typography variant="h3" fontWeight={800} sx={{ mt: 2, fontSize: { xs: "1.9rem", md: "3.1rem" }, letterSpacing: "-0.02em" }}>
              Debate Sessions in Higher Education
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mt: 1.5, mx: "auto", maxWidth: 780, fontSize: { xs: "1rem", md: "1.2rem" } }}
            >
              Host, moderate, and participate in structured university debates with live scoring, real-time messaging, and instructor tools.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" alignItems="center" sx={{ mt: 3.5 }}>
              <Button variant="contained" size="large" onClick={() => navigate("/login")}>Login</Button>
              <Button variant="outlined" size="large" onClick={() => navigate("/register")}>Register</Button>
              <Button color="secondary" variant="text" size="large" onClick={() => navigate("/admin/login")}>Admin Login</Button>
            </Stack>
          </Paper>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={0.5}>
            <Typography variant="h5" fontWeight={700}>
              Open Debates
            </Typography>
            <Chip label={`${debates.length} live`} size="small" color="primary" variant="outlined" />
          </Box>

          {debates.length === 0 ? (
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No public debates at the moment.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
              {debates.map((debate) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={debate.joincode}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      height: "100%",
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: isDark ? `0 10px 24px ${alpha("#05090f", 0.5)}` : `0 10px 24px ${alpha("#0f2b4d", 0.18)}`,
                      },
                    }}
                  >
                    <CardActionArea onClick={() => navigate(`/public/debate/${debate.joincode}`)} sx={{ p: 2.5, height: "100%" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{debate.title}</Typography>
                        <Chip label={debate.joincode} size="small" color="primary" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {debate.description}
                      </Typography>
                    </CardActionArea>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
