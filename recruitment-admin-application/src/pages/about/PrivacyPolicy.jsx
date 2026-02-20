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
import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
  const { t } = useTranslation();

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
              {t('privacy_policy')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={360}
            >
              {t('privacy_tagline')}
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('privacy_intro')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('privacy_collection')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('privacy_usage')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('privacy_security')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('privacy_agreement')}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}