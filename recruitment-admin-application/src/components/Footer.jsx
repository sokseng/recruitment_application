// Footer.jsx  (compact version)
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Copyright,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function Footer() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const { access_token, user_type } = useAuthStore();

  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Facebook fontSize="small" />, url: 'https://www.facebook.com/mok.kolsambath012', label: 'Facebook' },
    { icon: <Twitter fontSize="small" />, url: '', label: 'Twitter' },
    { icon: <LinkedIn fontSize="small" />, url: '', label: 'LinkedIn' },
    { icon: <Instagram fontSize="small" />, url: '', label: 'Instagram' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        // bgcolor: 'grey.900',
        color: 'grey.400',
        // borderTop: '1px solid',
        // borderColor: 'grey.800',
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
            <Copyright fontSize="inherit" /> {currentYear} True Match 360. All rights reserved.
          </Typography>

          {/* Center – Quick important links (optional) */}
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
              About Us
            </Link>
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/privacy_policy')}
              underline="hover"
              sx={{ color: 'primary.light', '&:hover': { color: 'primary.light' } }}
            >
              Privacy Policy
            </Link>
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/term_of_use')}
              underline="hover"
              sx={{ color: 'primary.light', '&:hover': { color: 'primary.light' } }}
            >
              Term of Use
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