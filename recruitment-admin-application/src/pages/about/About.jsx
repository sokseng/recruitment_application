// src/pages/About.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Divider,
  Stack,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import {
  LocationOn,
  Phone,
  Email,
  InfoOutlineRounded,
} from "@mui/icons-material";

export default function About() {
  return (
    <Box sx={{ py: { xs: 4, md: 5 }}}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
            bgcolor: "white",
          }}
        >
          {/* Header */}
          <Stack alignItems="center" spacing={1.5} mb={3}>
            <InfoOutlineRounded sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              True Match 360
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
            >
              Connecting talent with leading companies in Cambodia
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              Founded in 2026, True Match 360 is a Cambodia-based recruitment
              agency specializing in executive, management, and senior-level
              talent acquisition.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              Our mission is to match skilled professionals with dynamic
              companies where both can grow and succeed together.
            </Typography>

            {/* Contact */}
            <Stack spacing={1.5} mt={1}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <LocationOn fontSize="small" color="primary" />
                <Typography variant="body2">
                  Mean Chey, Phnom Penh, Cambodia
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Phone fontSize="small" color="primary" />
                <MuiLink
                  href="tel:+85512345678"
                  underline="hover"
                  color="primary"
                  variant="body2"
                >
                  012 345 678
                </MuiLink>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Email fontSize="small" color="primary" />
                <MuiLink
                  href="mailto:truematch360@gmail.com"
                  underline="hover"
                  color="primary"
                  variant="body2"
                >
                  truematch360@gmail.com
                </MuiLink>
              </Stack>
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
          >
            True Match 360 — Trusted recruitment partner in Cambodia
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
