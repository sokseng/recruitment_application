// src/pages/TermofUse.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Divider,
  Stack,
  Paper,
} from "@mui/material";
import { Gavel } from "@mui/icons-material";

export default function TermofUse() {
  return (
    <Box py={1}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 4,
            border: "3px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
          <Stack alignItems="center" spacing={1.5} mb={2}>
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
              <Gavel fontSize="medium" />
            </Box>

            <Typography variant="h6" fontWeight={700}>
              Terms of Use
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={420}
            >
              Please read these terms carefully before using the True Match 360
              platform
            </Typography>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              By accessing or using <strong>True Match 360</strong>, you agree to
              comply with and be bound by these Terms of Use. If you do not agree
              with any part of these terms, please discontinue use of our
              services.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              True Match 360 provides an online recruitment platform connecting
              job seekers and employers throughout Cambodia. Users are
              responsible for ensuring that all information provided is
              accurate, complete, and up to date.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities carried out under your
              account.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              Users must not misuse the platform, attempt unauthorized access,
              interfere with system operations, or submit false, misleading, or
              unlawful content.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              True Match 360 reserves the right to suspend or terminate user
              accounts that violate these terms, with or without prior notice.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              These Terms of Use may be updated periodically. Continued use of
              the platform following any changes constitutes acceptance of the
              revised terms.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
