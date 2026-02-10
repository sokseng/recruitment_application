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
    <Box 
      sx={{ 
        py: { xs: 4, md: 6 }, 
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 3 },
            borderRadius: 4,
            border: "3px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
          <Stack alignItems="center" spacing={1.5} mb={0}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.light",
                color: "white",
              }}
            >
              <InfoOutlineRounded fontSize="medium" />
            </Box>

            <Typography variant="h6" fontWeight={700}>
              True Match 360
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={320}
            >
              Connecting top talent with leading companies across Cambodia
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* About Content */}
          <Stack spacing={2.5}>
            <Typography
              variant="body2"
              color="text.secondary"
              lineHeight={1.8}
            >
              Founded in 2026, <strong>True Match 360</strong> is a
              Cambodia-based recruitment agency specializing in executive,
              management, and senior-level talent acquisition.
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              lineHeight={1.8}
            >
              Our mission is simple — to connect skilled professionals with
              forward-thinking companies where both can grow, perform, and
              succeed together.
            </Typography>

            {/* Contact Section */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: "grey.100",
                border: "2px solid",
                borderColor: "divider"
              }}
            >
              <Stack spacing={1.5}>
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
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
