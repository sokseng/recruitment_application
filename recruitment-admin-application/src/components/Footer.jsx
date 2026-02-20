// Footer.jsx (compact version)
import {
  Copyright,
  Facebook,
  Instagram,
  LinkedIn,
  Twitter,
} from '@mui/icons-material';
import {
  Box,
  Container,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { 
      icon: <Facebook fontSize="small" />, 
      // url: "", 
      label: "Facebook" 
    },
    { 
      icon: <Twitter fontSize="small" />, 
      // url: "", 
      label: "Twitter" 
    },
    { 
      icon: <LinkedIn fontSize="small" />, 
      // url: "", 
      label: "LinkedIn" 
    },
    { 
      icon: <Instagram fontSize="small" />, 
      // url: "", 
      label: "Instagram" 
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        color: 'grey.400',
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{p: 0.01}}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'center', sm: 'center' }}
          spacing={{ xs: 2, sm: 0 }}
          sx={{ fontSize: '0.875rem' }}
        >
          {/* Left – Copyright */}
          <Typography 
            variant="body2" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'grey.600',
            }}
          >
            <Copyright fontSize="inherit" /> {t('copyright', { year: currentYear })}
          </Typography>

          {/* Center – Quick important links */}
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ 
            //   display: { xs: 'none', md: 'flex' } 
            }}
          >
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/about')}
              underline="hover"
              sx={{ color: 'primary.light', '&:hover': { color: 'primary.light' } }}
            >
              {t('about_us')}
            </Link>
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/privacy_policy')}
              underline="hover"
              sx={{ color: 'primary.light', '&:hover': { color: 'primary.light' } }}
            >
              {t('privacy_policy')}
            </Link>
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/term_of_use')}
              underline="hover"
              sx={{ color: 'primary.light', '&:hover': { color: 'primary.light' } }}
            >
              {t('terms_of_use')}
            </Link>
          </Stack>

          {/* Right – Social icons + optional contact */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {socialLinks.map((item, index) => (
              <IconButton
                key={index}
                component="a"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  color: 'grey.500',
                  '&:hover': { 
                    color: 'primary.main',
                    bgcolor: 'rgba(255,255,255,0.08)'
                  },
                }}
                aria-label={item.label}
              >
                {item.icon}
              </IconButton>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}