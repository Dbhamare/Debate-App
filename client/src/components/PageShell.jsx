import React from "react";
import { Box } from "@mui/material";

export default function PageShell({
  children,
  headerHeight = 72,
  footerHeight = 0,
  maxWidth = 1200,
  disableGutters = false,
}) {
  return (
    <Box
      sx={{
        minHeight: `calc(100vh - ${headerHeight + footerHeight}px)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        className="page-container"
        sx={{
          maxWidth,
          width: "100%",
          margin: "0 auto",
          padding: disableGutters ? 0 : { xs: 2, sm: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
