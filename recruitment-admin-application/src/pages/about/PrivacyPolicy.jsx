// src/pages/PrivacyPolicy.jsx
import React from "react";
import {
  Box,
  Container,
  Typography,
  Divider,
  Stack,
  Paper,
} from "@mui/material";
import { Security } from "@mui/icons-material";

export default function PrivacyPolicy() {
  return (
    <Box py={{xs: 4, md: 1}}>
      <Container maxWidth="md">
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
            <Security sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Privacy Policy
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
            >
              Your privacy matters to True Match 360
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              True Match 360 respects your privacy and is committed to protecting
              your personal information. This policy explains how we collect,
              use, and safeguard your data.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              We may collect personal details such as your name, contact
              information, employment history, and resume when you register or
              apply for jobs on our platform.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              Your information is used only for recruitment purposes, improving
              our services, and connecting candidates with potential employers.
              We do not sell or share your data with third parties without your
              consent.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              We take reasonable security measures to protect your data from
              unauthorized access, misuse, or disclosure.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
              By using True Match 360, you agree to this Privacy Policy. We may
              update this policy from time to time, and changes will be posted
              on this page.
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
