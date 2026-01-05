import {
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Box,
} from '@mui/material'

export default function Dashboard() {
  return (
    <>
      <Grid container spacing={2}>
        {/* LEFT CARD – JOB ANNOUNCEMENTS */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Announcements
              </Typography>

              <List>
                <ListItem button selected>
                  <ListItemText
                    primary="Software Developer"
                    secondary="IT Department"
                  />
                  <Chip label="Open" color="success" size="small" />
                </ListItem>

                <Divider />

                <ListItem button>
                  <ListItemText
                    primary="HR Manager"
                    secondary="Human Resource"
                  />
                  <Chip label="Closed" color="default" size="small" />
                </ListItem>

                <Divider />

                <ListItem button>
                  <ListItemText
                    primary="UI/UX Designer"
                    secondary="Design Team"
                  />
                  <Chip label="Open" color="success" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT CARD – JOB DETAILS */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Details
              </Typography>

              <Typography variant="subtitle1" fontWeight="bold">
                Software Developer
              </Typography>

              <Typography color="text.secondary" gutterBottom>
                IT Department • Full-time
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body2">
                  We are looking for a Software Developer to build and maintain
                  web applications. The candidate should have experience with
                  React and FastAPI.
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Requirements</Typography>
                <Typography variant="body2">
                  • 2+ years experience<br />
                  • React / JavaScript<br />
                  • REST API knowledge
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip label="Open" color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
