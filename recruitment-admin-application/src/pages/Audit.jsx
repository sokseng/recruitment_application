import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const Audit = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);

  const fetchAuditTraces = async () => {
    try {
      const response = await api.get("/audit-trace");
      setRows(response.data || []);
    } catch (err) {
      console.log("Error fetching audit traces:", err);
    }
  };

  useEffect(() => {
    fetchAuditTraces();
  }, []);

  /* ================= Columns ================= */
  const columns = [
    {
      field: "action_datetime",
      headerName: t('action_datetime'),
      flex: 1,
      minWidth: 180,
    },
    {
      field: "user_action",
      headerName: t('user_action'),
      flex: 1,
      minWidth: 150,
    },
    {
      field: "action",
      headerName: t('action'),
      flex: 1,
      minWidth: 120,
    },
    {
      field: "detail_information",
      headerName: t('detail_information'),
      flex: 3,
      minWidth: 250,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "ip",
      headerName: t('ip_address'),
      flex: 0.5,
      minWidth: 120,
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* DataGrid Container */}
      <Box
        sx={{
          flex: 1,
          border: "3px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.pk_id}
          pageSizeOptions={[18, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 18, page: 0 } },
          }}
          disableRowSelectionOnClick
          rowHeight={52}
          density="compact"
          getRowHeight={() => "auto"}
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",

            "& .MuiDataGrid-columnHeaders": {
              background: "linear-gradient(180deg, #f9fafb, #f1f5f9)",
              fontWeight: 700,
              fontSize: 13,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            },

            "& .MuiDataGrid-row:hover": {
              backgroundColor: "rgba(25,118,210,0.06)",
            },

            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f0f0f0",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Audit;