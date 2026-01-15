import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  IconButton,
  Stack,
  Avatar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EmailIcon from '@mui/icons-material/Email'

export default function CandidateProfileDashboard() {
  return (
    <Box sx={{ mx: 'auto', py: 4, px: 2, bgcolor: '#f0f2f5', borderRadius: 3, minHeight: '100vh' }}>
      {/* Profile Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          bgcolor: '#fff',
          boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)',
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" mb={3}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: '#3b5998',
              fontSize: 32,
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgb(0 0 0 / 0.15)',
            }}
          >
            B
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="700" mb={0.3}>
              BRO Rathana
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary" mb={0.5}>
              <LocationOnIcon fontSize="small" />
              <Typography variant="body2">Cambodia, Phnom Penh</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <EmailIcon fontSize="small" />
              <Typography variant="body2">nirout.rathana0001@gmail.com</Typography>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Summary Fields */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 4 }}
          justifyContent="space-between"
          flexWrap="wrap"
        >
          {[
            ['Employment Status', 'Open to Work'],
            ['Experience Level', 'Entry Level'],
            ['Job Function or Category', 'IT / Hardware, Software'],
            ['Expected Salary', '$ -'],
          ].map(([label, value]) => (
            <Box key={label} sx={{ minWidth: 150 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Sections */}
      <SectionWithAddButton
        title="Overview"
        description="About BRO Rathana. Career Objectives."
        buttonText="Edit Overview"
        onAdd={() => alert('Edit Overview')}
        isEdit
      />

      <SectionWithAddButton
        title="Work Experiences"
        description="Add Work Experience to be found by more Employers"
        buttonText="Add Work Experience"
        onAdd={() => alert('Add Work Experience')}
      />

      <SectionWithAddButton
        title="Education & Qualifications"
        description="Add Education to be found by more Employers"
        buttonText="Add Education"
        onAdd={() => alert('Add Education')}
      />

      <SectionWithAddButton
        title="Skills"
        description="Add Skills to be found by more Employers"
        buttonText="Add Skill"
        onAdd={() => alert('Add Skill')}
      />

      <SectionWithAddButton
        title="Languages"
        description="Add Languages to be found by more Employers"
        buttonText="Add Language"
        onAdd={() => alert('Add Language')}
        isEdit
      />

      <SectionWithAddButton
        title="References"
        description="Add References to make your profile look more professional"
        buttonText="Add Reference"
        onAdd={() => alert('Add Reference')}
      />

      <SectionWithAddButton
        title="Preferred Industries to work"
        description="Add Preferred Industries to make your profile look more professional"
        buttonText="Add Preferred Industry"
        onAdd={() => alert('Add Preferred Industry')}
        isEdit
      />
    </Box>
  )
}

function SectionWithAddButton({ title, description, buttonText, onAdd, isEdit }) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        bgcolor: '#fff',
        position: 'relative',
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.05)',
      }}
    >
      <Typography
        variant="h6"
        fontWeight="700"
        mb={1}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {title}
        {isEdit && (
          <IconButton
            size="small"
            color="primary"
            aria-label={`Edit ${title}`}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(59, 89, 152, 0.1)',
              },
              transition: 'background-color 0.3s',
            }}
            onClick={onAdd}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.5 }}>
        {description}
      </Typography>

      {!isEdit && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgb(59 89 152 / 0.2)',
            '&:hover': {
              bgcolor: '#2d4373',
              boxShadow: '0 4px 12px rgb(59 89 152 / 0.4)',
            },
            borderRadius: 2,
            px: 3,
          }}
        >
          {buttonText}
        </Button>
      )}
    </Paper>
  )
}
