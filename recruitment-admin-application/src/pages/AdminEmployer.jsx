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
  Switch,
  Snackbar,
  Alert,
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
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 8;

const AdminEmployers = () => {
  const { t } = useTranslation();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [tabValue, setTabValue] = useState(0); // 0=Pending, 1=Approved
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

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

  const counts = {
    Pending: employers.filter((e) => e.status === "Pending").length,
    Approved: employers.filter((e) => e.status === "Approved").length,
  };

  const getFilteredEmployers = () => {
    let statusFiltered = employers;

    if (tabValue === 0) {
      statusFiltered = employers.filter((emp) => emp.status === "Pending");
    } else if (tabValue === 1) {
      statusFiltered = employers.filter((emp) => emp.status === "Approved");
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

  const handleApprove = async () => {
    if (!selectedEmployer) return;
    try {
      await api.put(`/user/approve/${selectedEmployer.user_id}`);

      setSnackbarMessage(t('employer_approved_success'));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      fetchEmployers();

      setOpenDetail(false);
    } catch (err) {
      console.error(err);
      setSnackbarMessage(t('employer_approve_failed'));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          allowScrollButtonsMobile
          sx={{
            mb: 3,
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid",
            borderColor: "divider",
            "& .MuiTabs-flexContainer": {
              padding: "4px 8px",
            },
            "& .MuiTabs-indicator": {
              height: 4,
              borderRadius: 4,
              background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
              bottom: 0,
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              minHeight: 56,
              color: "text.primary",
              opacity: 0.75,
              transition: "all 0.25s ease",
              borderRadius: 2,
              margin: "0 4px",
              padding: "0 20px",

              "&:hover": {
                opacity: 1,
                backgroundColor: alpha("#e2e8f0", 0.4),
              },

              "&.Mui-selected": {
                color: "#1e40af",
                fontWeight: 700,
                opacity: 1,
                backgroundColor: alpha("#eff6ff", 0.6),
              },
            },
          }}
        >
          <Tab
            label={
              <Badge
                badgeContent={counts.Pending}
                color="warning"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.75rem",
                    minWidth: 20,
                    height: 20,
                    borderRadius: "10px",
                  },
                }}
              >
                {t('pending')}
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={counts.Approved}
                color="success"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.75rem",
                    minWidth: 20,
                    height: 20,
                    borderRadius: "10px",
                  },
                }}
              >
                {t('approved')}
              </Badge>
            }
          />
        </Tabs>

        {/* Search field */}
        <TextField
          size="small"
          placeholder={t('search_companies')}
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

        {!loading && totalItems > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, display: { xs: "block", sm: "inline-block" }, ml: { sm: 2 } }}
          >
            {t('showing_items', { 
              start: startIndex + 1, 
              end: Math.min(startIndex + ITEMS_PER_PAGE, totalItems), 
              total: totalItems 
            })}
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

              <Chip
                label={emp.status === "Approved" ? t('approved') : t('pending')}
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
                  }),
                  ...(emp.status === "Pending" && {
                    borderColor: "#f59e0b",
                    color: "#f59e0b",
                    bgcolor: "rgba(245,158,11,0.08)",
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
                  {t('view_details')}
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

      {/* Detail Dialog */}
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
            <DialogTitle
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pr: 2,
              }}
            >
              <Typography fontWeight={700}>{t('company_details')}</Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                {selectedEmployer?.status === "Pending" && (
                  <Button
                    title={t('approve')}
                    variant="contained"
                    size="small"
                    onClick={() => setOpenConfirm(true)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 20,
                      px: 2.5,
                      background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                      boxShadow: "0 4px 12px rgba(16,185,129,0.4)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                      },
                    }}
                  >
                    {t('approve_now')}
                  </Button>
                )}

                <IconButton onClick={handleCloseDetail}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2 }}>
              <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
                <Avatar
                  src={
                    selectedEmployer.company_logo
                      ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${selectedEmployer.company_logo}`
                      : "/default-company.png"
                  }
                  sx={{
                    width: 80,
                    height: 80,
                    boxShadow: 3,
                    border: "2px solid #f0f0f0",
                  }}
                />

                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedEmployer.company_name}
                    </Typography>

                    <Chip
                      label={selectedEmployer.status === "Approved" ? t('approved') : t('pending')}
                      size="small"
                      sx={{
                        background: selectedEmployer.status === "Approved"
                          ? "linear-gradient(135deg, #43a047 0%, #66bb6a 100%)"
                          : selectedEmployer.status === "Pending"
                            ? "linear-gradient(135deg, #fb8c00 0%, #ffa726 100%)"
                            : "linear-gradient(135deg, #e53935 0%, #ef5350 100%)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 11,
                        height: 26,
                        borderRadius: 14,
                        px: 1.5,
                        boxShadow:
                          selectedEmployer.status === "Approved"
                            ? "0 3px 6px rgba(76,175,80,0.4)"
                            : selectedEmployer.status === "Pending"
                              ? "0 3px 6px rgba(251,140,0,0.4)"
                              : "0 3px 6px rgba(229,57,53,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
                  >
                    <EmailIcon fontSize="inherit" /> {selectedEmployer.company_email || "—"}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('contact')}:</strong> {selectedEmployer.company_contact || "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('address')}:</strong> {selectedEmployer.company_address || "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <LanguageIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>{t('website')}:</strong>{" "}
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
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    <strong>{t('jobs_posted')}</strong>
                  </Typography>
                  <Typography variant="h6">{selectedEmployer.job_count || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    <strong>{t('categories')}</strong>
                  </Typography>
                  <Typography variant="body2">
                    {selectedEmployer.categories?.map((c) => c.name).join(", ") || "—"}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('about_company')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                  {selectedEmployer.company_description || t('no_description')}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Confirm Approve Dialog */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('confirm_approval')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            {t('confirm_approval_message', { company: selectedEmployer?.company_name })}
          </Typography>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={() => setOpenConfirm(false)}
            >
              {t('cancel')}
            </Button>

            <Button
              variant="contained"
              color="success"
              size="small"
              sx={{ textTransform: "none" }}
              onClick={async () => {
                setOpenConfirm(false);
                await handleApprove();
              }}
            >
              {t('yes_approve')}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} variant="filled" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminEmployers;