// src/pages/About.jsx
import {
  Email,
  InfoOutlineRounded,
  LocationOn,
  Phone,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from 'react-i18next';


export default function About() {
  const { t, i18n } = useTranslation();

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
              {t('true_match_360')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              maxWidth={320}
            >
              {t('about_tagline')}
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
              {t('about_founded')}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              lineHeight={1.8}
            >
              {t('about_mission')}
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
                    {t('about_address')}
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
                    {t('about_phone')}
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
                    {t('about_email')}
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