// LanguageSwitcher.jsx (with SVG flags)
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Flag from 'react-world-flags';

const languageNames = {
  km: 'ភាសាខ្មែរ',
  en: 'English',
  fr: 'Français',
  
};

const countryCodes = {
  km: 'KH',
  en: 'GB',
  fr: 'FR',
  
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleClose();
  };

  const currentLanguage = i18n.language;

  // For mobile - icon button with flag
  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            ml: 0.5,
            color: 'teal',
            backgroundColor: open ? 'rgba(0, 176, 255, 0.08)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 176, 255, 0.08)',
            }
          }}
        >
          <Flag 
            code={countryCodes[currentLanguage]} 
            style={{ 
              width: 20, 
              height: 15, 
              marginRight: 4,
              borderRadius: 2
            }} 
          />
          <ArrowDropDownIcon fontSize="small" />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 160,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }
          }}
        >
          {Object.keys(languageNames).map((code) => (
            <MenuItem
              key={code}
              onClick={() => changeLanguage(code)}
              selected={currentLanguage === code}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.lighter',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.lighter',
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Flag 
                  code={countryCodes[code]} 
                  style={{ 
                    width: 24, 
                    height: 18,
                    borderRadius: 2
                  }} 
                />
              </ListItemIcon>
              <ListItemText 
                primary={languageNames[code]}
                primaryTypographyProps={{
                  fontWeight: currentLanguage === code ? 600 : 400,
                }}
              />
              {currentLanguage === code && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    ml: 1,
                  }}
                />
              )}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // For desktop - button with dropdown
  return (
    <>
      <Button
        onClick={handleClick}
        endIcon={<ArrowDropDownIcon />}
        sx={{
          color: '#1e3a8a',
          textTransform: 'none',
          fontWeight: 500,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 2,
          py: 0.8,
          '&:hover': {
            backgroundColor: 'rgba(0, 176, 255, 0.04)',
            borderColor: 'primary.main',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Flag 
            code={countryCodes[currentLanguage]} 
            style={{ 
              width: 24, 
              height: 18,
              borderRadius: 2
            }} 
          />
          <Typography variant="body2">
            {languageNames[currentLanguage]}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }
        }}
      >
        {Object.keys(languageNames).map((code) => (
          <MenuItem
            key={code}
            onClick={() => changeLanguage(code)}
            selected={currentLanguage === code}
            sx={{
              py: 1.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.lighter',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.lighter',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Flag 
                code={countryCodes[code]} 
                style={{ 
                  width: 28, 
                  height: 20,
                  borderRadius: 2
                }} 
              />
            </ListItemIcon>
            <ListItemText 
              primary={languageNames[code]}
              secondary={code === 'en' ? 'English' : code === 'fr' ? 'French' : 'Khmer'}
              primaryTypographyProps={{
                fontWeight: currentLanguage === code ? 600 : 400,
              }}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
            {currentLanguage === code && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  ml: 1,
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}