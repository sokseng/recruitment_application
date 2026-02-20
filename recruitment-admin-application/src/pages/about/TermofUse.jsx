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
import { useTranslation } from 'react-i18next';

export default function TermofUse() {
  const { t } = useTranslation();

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
              {t('terms_of_use')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={420}
            >
              {t('terms_tagline')}
            </Typography>
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {/* Content */}
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_intro')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_platform')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_account_responsibility')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_prohibited')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_suspension')}
            </Typography>

            <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
              {t('terms_updates')}
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}