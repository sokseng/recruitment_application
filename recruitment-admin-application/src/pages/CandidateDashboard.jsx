import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";

const CandidateDashboard = () => {
  const jobs = [
    {
      title: "IT Infrastructure Officer",
      company: "Toyota Cambodia Co. Ltd.",
      location: "Phnom Penh",
    },
    {
      title: "Senior IT Officer - Retail",
      company: "WING BANK (CAMBODIA) PLC",
      location: "Phnom Penh",
    },
    {
      title: "IT Support Officer",
      company: "JobNet Corporate Sales",
      location: "Phnom Penh",
    },
    {
      title: "IT Systems Administrator",
      company: "Cambodia Airports",
      location: "Kandal",
    },
  ];

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", p: 2 }}>
      <Grid container spacing={2} justifyContent="center">
        
        {/* LEFT SIDEBAR */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
                  B
                </Avatar>

                <Box textAlign="center">
                  <Typography fontWeight="bold">
                    BRO rathana
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    nim.rathana9999@gmail.com
                  </Typography>
                </Box>

                <Divider flexItem />

                <Typography variant="body2">
                  Open to Work opportunity
                </Typography>

                <Button size="small" variant="contained">
                  Yes
                </Button>

                <Divider flexItem />

                <Typography fontWeight="bold" fontSize={14}>
                  Update your profile to get more jobs
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                >
                  Update Your Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT CONTENT */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            
            {/* WHO VIEWED */}
            <Card>
              <CardContent>
                <Typography fontWeight="bold" mb={1}>
                  Who Viewed Your Profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Employer has not viewed yet
                </Typography>
              </CardContent>
            </Card>

            {/* JOB LIST */}
            <Card>
              <CardContent>
                <Typography fontWeight="bold" mb={2}>
                  Jobs You Will Love
                </Typography>

                <Stack spacing={2}>
                  {jobs.map((job, index) => (
                    <Box key={index}>
                      <Typography
                        fontWeight="bold"
                        color="primary"
                      >
                        {job.title}
                      </Typography>
                      <Typography variant="body2">
                        {job.company}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {job.location}
                      </Typography>
                      <Divider sx={{ mt: 1 }} />
                    </Box>
                  ))}
                </Stack>

                <Box textAlign="center" mt={2}>
                  <Button size="small">
                    View More Jobs
                  </Button>
                </Box>
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateDashboard;
