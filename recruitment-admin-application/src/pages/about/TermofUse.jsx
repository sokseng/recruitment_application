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
    <Box sx={{ py: { xs: 4, md: 1 } }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 3 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "grey.200",
            bgcolor: "white",
          }}
        >
          {/* Header */}
          <Stack alignItems="center" spacing={1.5} mb={2}>
            <Gavel sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Terms of Use
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
            >
              Please read these terms carefully before using our platform
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              By accessing or using True Match 360, you agree to comply with and
              be bound by these Terms of Use. If you do not agree, please do not
              use our services.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              True Match 360 provides an online recruitment platform connecting
              job seekers and employers in Cambodia. Users must provide accurate
              and up-to-date information at all times.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              Users must not misuse the platform, attempt unauthorized access,
              or upload false, misleading, or unlawful content.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              True Match 360 reserves the right to suspend or terminate accounts
              that violate these terms without prior notice.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              These terms may be updated periodically. Continued use of the
              platform constitutes acceptance of any changes.
            </Typography>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
          >
            © {new Date().getFullYear()} True Match 360. All rights reserved.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
