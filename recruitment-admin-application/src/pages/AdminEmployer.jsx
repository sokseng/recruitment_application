import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  Divider,
  TextField,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  alpha,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import CloseIcon from "@mui/icons-material/Close";
import LanguageIcon from "@mui/icons-material/Language";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import api from "../services/api";

const ITEMS_PER_PAGE = 8;

const AdminEmployers = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [tabValue, setTabValue] = useState(0); // 0=Pending, 1=Approved, 2=Inactive
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employer");
      const data = res.data || [];
      setEmployers(data);
    } catch (err) {
      console.error("Failed to load employers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  // Compute counts for badges
  const counts = {
    Pending: employers.filter((e) => e.status === "Pending").length,
    Approved: employers.filter((e) => e.status === "Approved").length,
    Disabled: employers.filter((e) => e.status === "Disabled").length,
  };

  // Filter by tab + search
  const getFilteredEmployers = () => {
    let statusFiltered = employers;

    if (tabValue === 0) {
      statusFiltered = employers.filter((emp) => emp.status === "Pending");
    } else if (tabValue === 1) {
      statusFiltered = employers.filter((emp) => emp.status === "Approved");
    } else if (tabValue === 2) {
      statusFiltered = employers.filter((emp) => emp.status === "Disabled");
    }

    const term = searchTerm.toLowerCase().trim();
    if (!term) return statusFiltered;

    return statusFiltered.filter((emp) =>
      emp.company_name?.toLowerCase().includes(term)
    );
  };

  const filteredEmployers = getFilteredEmployers();

  const totalItems = filteredEmployers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedEmployers = filteredEmployers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when tab or search changes
  useEffect(() => {
    setPage(1);
  }, [tabValue, searchTerm]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDetail = (emp) => {
    setSelectedEmployer(emp);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>

      <Box sx={{ mb: 3 }}>
        {/* Tabs – nice modern style */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          allowScrollButtonsMobile
          sx={{
            mb: 2.5,
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: alpha("#f8f9fa", 0.7),
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: "4px 4px 0 0",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              py: 1.8,
              minHeight: 56,
              color: "text.primary",
              "&.Mui-selected": {
                color: "primary.main",
                fontWeight: 700,
              },
            },
          }}
        >
          <Tab
            label={
              <Badge badgeContent={counts.Pending} color="warning" sx={{ px: 1 }}>
                Pending
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={counts.Approved} color="success" sx={{ px: 1 }}>
                Approved
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={counts.Disabled} color="error" sx={{ px: 1 }}>
                Disabled
              </Badge>
            }
          />
        </Tabs>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 360 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              bgcolor: alpha("#f8f9fa", 0.85),
              transition: "all 0.2s",
              "&:hover": { bgcolor: "#f1f3f5" },
              "&.Mui-focused": { bgcolor: "white" },
            },
          }}
        />

        {/* Results count */}
        {!loading && totalItems > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, display: { xs: "block", sm: "inline-block" }, ml: { sm: 2 } }}
          >
            Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </Typography>
        )}
      </Box>

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
            md: "repeat(3,1fr)",
            lg: "repeat(4,1fr)",
          },
          gap: 2.5,
        }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: 4 }} />
          ))
          : paginatedEmployers.map((emp) => (
            <Card
              key={emp.pk_id}
              onClick={() => handleOpenDetail(emp)}
              elevation={1}
              sx={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                transition: "all 0.22s ease",
                cursor: "pointer",
                bgcolor: "white",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.11)",
                  "& .view-btn": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              <Box sx={{ height: 50, bgcolor: "primary.light", position: "relative" }}>
                <Avatar
                  src={
                    emp.company_logo
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${emp.company_logo}`
                      : "/default-company.png"
                  }
                  sx={{
                    width: 72,
                    height: 72,
                    border: "4px solid white",
                    position: "absolute",
                    bottom: -36,
                    left: "50%",
                    transform: "translateX(-50%)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
              </Box>

              {/* Status Chip – keeping your last version (outlined + subtle bg) */}
              <Chip
                label={emp.status}
                size="small"
                variant="outlined"
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  height: 26,
                  borderRadius: "12px",
                  fontSize: 11,
                  fontWeight: 700,
                  px: 1.5,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  ...(emp.status === "Approved" && {
                    borderColor: "#10b981",
                    color: "#10b981",
                    bgcolor: "rgba(16,185,129,0.08)",
                    "&:hover": { bgcolor: "rgba(16,185,129,0.14)" },
                  }),
                  ...(emp.status === "Pending" && {
                    borderColor: "#f59e0b",
                    color: "#f59e0b",
                    bgcolor: "rgba(245,158,11,0.08)",
                    "&:hover": { bgcolor: "rgba(245,158,11,0.14)" },
                  }),
                  ...(emp.status === "Disabled" && {
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    bgcolor: "rgba(239,68,68,0.08)",
                    "&:hover": { bgcolor: "rgba(239,68,68,0.14)" },
                  }),
                }}
              />

              <CardContent sx={{ pt: 6, pb: 3, textAlign: "center" }}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {emp.company_name}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                  {emp.company_email || "—"}
                </Typography>

                <Stack direction="row" justifyContent="center" spacing={4} sx={{ mb: 2 }}>
                  <Stack alignItems="center">
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {emp.categories?.length || 0}
                    </Typography>
                  </Stack>
                  <Stack alignItems="center">
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {emp.job_count || 0}
                    </Typography>
                  </Stack>
                </Stack>

                <Button
                  size="small"
                  variant="outlined"
                  className="view-btn"
                  sx={{
                    borderRadius: 20,
                    textTransform: "none",
                    px: 1,
                    opacity: 0.7,
                    transform: "translateY(6px)",
                    transition: "all 0.25s ease",
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
      </Box>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ mt: 5, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": { borderRadius: 2 },
            }}
          />
        </Box>
      )}

      {/* Detail Dialog – unchanged */}
      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 4,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          },
        }}
      >
        {selectedEmployer && (
          <>
            <DialogTitle sx={{ pb: 1, pr: 8 }}>
              Company Profile
              <IconButton
                onClick={handleCloseDetail}
                sx={{ position: "absolute", right: 12, top: 12 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
              {/* ... your dialog content remains exactly the same ... */}
              <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  src={
                    selectedEmployer.company_logo
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${selectedEmployer.company_logo}`
                      : "/default-company.png"
                  }
                  sx={{ width: 80, height: 80, boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {selectedEmployer.company_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <EmailIcon fontSize="inherit" /> {selectedEmployer.company_email || "—"}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Contact:</strong> {selectedEmployer.company_contact || "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedEmployer.company_address || "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LanguageIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Website:</strong>{" "}
                    {selectedEmployer.company_website ? (
                      <a
                        href={selectedEmployer.company_website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1976d2" }}
                      >
                        {selectedEmployer.company_website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      <strong>Jobs Posted</strong>
                    </Typography>
                    <Typography variant="h6">{selectedEmployer.job_count || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      <strong>Categories</strong>
                    </Typography>
                    <Typography variant="body2">
                      {selectedEmployer.categories?.map((c) => c.name).join(", ") || "—"}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    About the Company
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                    {selectedEmployer.company_description || "No description provided."}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminEmployers;