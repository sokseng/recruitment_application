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
    <Box py={1}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "3px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
          <Stack alignItems="center" spacing={1.5} mb={4}>
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
              <Security fontSize="medium" />
            </Box>

            <Typography variant="h6" fontWeight={700}>
              Privacy Policy
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={360}
            >
              Your privacy and data security matter to True Match 360
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              At <strong>True Match 360</strong>, we respect your privacy and are
              committed to protecting your personal information. This Privacy
              Policy explains how we collect, use, and safeguard your data.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              We may collect personal information such as your name, contact
              details, employment history, and resume when you register, apply
              for jobs, or interact with our platform.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              Your information is used solely for recruitment purposes,
              improving our services, and connecting candidates with potential
              employers. We do not sell, rent, or share your data with third
              parties without your consent.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              We implement reasonable technical and organizational security
              measures to protect your data from unauthorized access, loss,
              misuse, or disclosure.
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              By using True Match 360, you agree to this Privacy Policy. We may
              update this policy periodically, and any changes will be published
              on this page.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
