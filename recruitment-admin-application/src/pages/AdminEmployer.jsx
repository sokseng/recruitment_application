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
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";
import api from "../services/api";

const ITEMS_PER_PAGE = 8;

const AdminEmployers = () => {
  const [employers, setEmployers] = useState([]);
  const [filteredEmployers, setFilteredEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employer");
      const data = res.data || [];
      setEmployers(data);
      setFilteredEmployers(data);
    } catch (err) {
      console.error("Failed to load employers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = employers.filter((emp) =>
      emp.company_name?.toLowerCase().includes(term)
    );
    setFilteredEmployers(filtered);
    setPage(1);
  }, [searchTerm, employers]);

  const getCompanyStyle = (name) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("wing")) {
      return { bannerBg: "#2e7d32", avatarBg: "#388e3c", statusActiveBg: "#4caf50" };
    }
    if (lower.includes("woori")) {
      return { bannerBg: "#1976d2", avatarBg: "#1565c0", statusActiveBg: "#2196f3" };
    }
    if (lower.includes("rma")) {
      return { bannerBg: "#424242", avatarBg: "#616161", statusActiveBg: "#757575" };
    }
    return { bannerBg: "#455a64", avatarBg: "#607d8b", statusActiveBg: "#78909c" };
  };

  const totalItems = filteredEmployers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedEmployers = filteredEmployers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{}}>
      {/* Search remains the same - compact version */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "text.disabled" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: { sm: 320 },
            "& .MuiInputBase-input": { fontSize: "0.9rem", py: 0.9 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              backgroundColor: alpha("#fafafa", 0.85),
              height: 42,
              transition: "all 0.18s ease",
              "& fieldset": { borderColor: alpha("#000", 0.14), borderWidth: 1 },
              "&:hover fieldset": { borderColor: "primary.light" },
              "&.Mui-focused": {
                backgroundColor: "#ffffff",
                boxShadow: "0 0 0 2.5px rgba(25, 118, 210, 0.18)",
                "& fieldset": { borderColor: "primary.main", borderWidth: 1.5 },
              },
            },
            "& .MuiInputAdornment-root": { ml: 1 },
          }}
        />

        {!loading && totalItems > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap", fontSize: "0.875rem", alignSelf: "center" }}
          >
            Showing {startIndex + 1}–{endIndex} of {totalItems}
          </Typography>
        )}
      </Box>

      {/* Smaller cards grid */}
      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={2}
      >
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={160} animation="wave" />
          ))}

        {!loading &&
          paginatedEmployers.map((emp) => {
            const style = getCompanyStyle(emp.company_name);
            return (
              <Card
                key={emp.pk_id}
                sx={{
                  borderRadius: 2.5,
                  overflow: "hidden",
                  boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
                  transition: "all 0.18s",
                  bgcolor: "#fff",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.11)",
                  },
                }}
              >
                <Box sx={{ height: 48, bgcolor: style.bannerBg, position: "relative" }}>
                  <Avatar
                    src={
                      emp.company_logo
                        ? `${import.meta.env.VITE_API_BASE_URL}/uploads/employers/${emp.company_logo}`
                        : "/default-company.png"
                    }
                    alt={emp.company_name}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: style.avatarBg,
                      border: "3px solid white",
                      position: "absolute",
                      bottom: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  />

                  <Chip
                    label={emp.is_active ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 6,
                      right: 10,
                      bgcolor: emp.is_active ? `${style.statusActiveBg}cc` : "rgba(211, 47, 47, 0.92)",
                      color: "white",
                      fontSize: 9.5,
                      height: 20,
                      fontWeight: 600,
                      minWidth: 60,
                      border: "1px solid rgba(255,255,255,0.35)",
                    }}
                  />
                </Box>

                <CardContent sx={{ pt: 4, px: 1.5, pb: 1.5, textAlign: "center" }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ fontSize: 13.5, mb: 0.4, lineHeight: 1.2 }}
                  >
                    {emp.company_name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: 10.5, display: "block", mb: 0.8 }}
                  >
                    {emp.company_email || "—"}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" justifyContent="center" spacing={2.5} sx={{ mb: 1 }}>
                    <Box title="Category Type" sx={{ textAlign: "center" }}>
                      <BusinessIcon sx={{ fontSize: 14, color: "action.main", mb: 0.2 }} />
                      <Typography variant="caption" sx={{ fontSize: 10, display: "block" }}>
                        {emp.industry || "Banking"}
                      </Typography>
                    </Box>
                    <Box title="Job Count" sx={{ textAlign: "center" }}>
                      <WorkIcon sx={{ fontSize: 14, color: "action.main", mb: 0.2 }} />
                      <Typography variant="caption" sx={{ fontSize: 10, display: "block" }}>
                        {emp.job_count || 0}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                    📞 {emp.company_contact || "—"}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
      </Box>

      {!loading && (
        <Box
          sx={{
            mt: { xs: 3, sm: 4 },
            mb: { xs: 3, sm: 4 },           // give some breathing room at bottom
            minHeight: '40vh',               // helps center vertically when no data
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: totalItems === 0 ? 'center' : 'flex-start',
            gap: { xs: 2, sm: 3 },
            width: '100%',
            px: { xs: 1, sm: 2 },           // small padding on mobile
          }}
        >
          {totalItems === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: { xs: 4, sm: 6 },
                maxWidth: '360px',
                width: '100%',
              }}
            >
              <Box
                component="img"
                src="/No-Data.gif"
                alt="No data illustration"
                sx={{
                  width: { xs: '1400px', sm: '200px' },
                  height: 'auto',
                  mb: 1,
                  objectFit: 'contain',
                }}
              />
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{ fontWeight: 400 }}
              >
                
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? "Try different keywords or clear the search"
                  : "Companies will appear here once registered"}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: { xs: 2, sm: 3 },
                width: '100%',
                mt: 'auto',              // pushes pagination to bottom when content is short
              }}
            >
              {/* Optional: show current page info above pagination on larger screens */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.875rem',
                }}
              >
                Page {page} of {totalPages}
              </Typography>

              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="medium"
                showFirstButton
                showLastButton
                boundaryCount={1}
                siblingCount={1}
                sx={{
                  '& .MuiPagination-ul': {
                    flexWrap: 'nowrap',           // better mobile behavior
                  },
                  '& .MuiPaginationItem-root': {
                    borderRadius: '50%',
                    mx: { xs: 0.5, sm: 0.6 },
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    minWidth: { xs: 28, sm: 32 },
                    height: { xs: 28, sm: 32 },
                  },
                  '& .Mui-selected': {
                    backgroundColor: 'primary.main !important',
                    color: 'white !important',
                    fontWeight: 600,
                  },
                  // Make sure pagination stays visible and doesn't get cut off
                  mb: { xs: 2, sm: 4 },
                }}
              />

              {/* Mobile-friendly page indicator below pagination */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: { xs: 'block', sm: 'none' },
                  mt: 1,
                }}
              >
                Page {page} / {totalPages}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AdminEmployers;