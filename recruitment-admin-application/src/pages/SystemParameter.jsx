import SYSTEM_PARAMETER_TRANSLATIONS from "../translations/systemParameters";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
    Box,
    Stack,
    Checkbox,
    TextField,
    Button,
    CircularProgress
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { DataGrid } from "@mui/x-data-grid";
import api from "../services/api";
import { useTranslation } from 'react-i18next';

const SystemParameters = () => {
    const { t } = useTranslation();
    const [systemParameters, setSystemParameters] = useState([]);
    const [saving, setSaving] = useState(false);
    const originalDataRef = useRef([]);

    /* ================= Fetch ================= */
    const fetchSystemParameters = async () => {
        try {
            const res = await api.get("/global/parameter");
            const data = res.data || [];
            setSystemParameters(data);
            originalDataRef.current = JSON.parse(JSON.stringify(data)); // deep copy
        } catch (err) {
            console.error("Failed to load system parameters", err);
        }
    };

    useEffect(() => {
        fetchSystemParameters();
    }, []);

    /* ================= Change Detection ================= */
    const hasChanges = useMemo(() => {
        return systemParameters.some((item) => {
            const original = originalDataRef.current.find(
                (o) => o.pk_id === item.pk_id
            );
            return original && original.value !== item.value;
        });
    }, [systemParameters]);

    /* ================= Save ================= */
    const handleSave = async () => {
        try {
            if (!hasChanges) return;

            if (document.activeElement) document.activeElement.blur();

            const changedRows = systemParameters.filter((item) => {
                const original = originalDataRef.current.find(
                    (o) => o.pk_id === item.pk_id
                );
                return original && original.value !== item.value;
            });

            setSaving(true);
            await api.post("/global/parameter", { changedRows });

            originalDataRef.current = JSON.parse(JSON.stringify(systemParameters));
            await fetchSystemParameters();
        } catch (err) {
            console.error("Failed to save system parameters", err);
        } finally {
            setSaving(false);
        }
    };

    /* ================= Grid handlers ================= */
    const handleCellEditStop = useCallback((params) => {
        setSystemParameters((prev) =>
            prev.map((row) =>
                row.pk_id === params.id ? { ...row, [params.field]: params.value } : row
            )
        );
    }, []);

    const handleCellClick = useCallback((params, event) => {
        if (params.field === "value" && params.row.type !== "Boolean") {
            if (params.api.getCellMode(params.id, params.field) !== "edit") {
                event.defaultMuiPrevented = true;
                params.api.startCellEditMode({ id: params.id, field: params.field });
            }
        }
    }, []);

    const handleCellDoubleClick = handleCellClick;

    /* ================= Columns ================= */
    const columns = [
        {
            field: "name",
            headerName: t('name'),
            flex: 2,
            filterable: false,
            valueGetter: (value) =>
                SYSTEM_PARAMETER_TRANSLATIONS[value] || value,
        },
        {
            field: "value",
            headerName: t('value'),
            width: 220,
            editable: true,
            renderCell: (params) => {
                if (params.row.type === "Boolean") {
                    return (
                        <Checkbox
                            checked={params.value === true || params.value === "True"}
                            onChange={(e) => {
                                const newVal = e.target.checked;
                                setSystemParameters((prev) =>
                                    prev.map((row) =>
                                        row.pk_id === params.id
                                            ? { ...row, value: newVal }
                                            : row
                                    )
                                );
                            }}
                        />
                    );
                }
                return <span>{params.value}</span>;
            },
            renderEditCell: (params) => (
                <TextField
                    autoFocus
                    fullWidth
                    variant="standard"
                    type={params.row.type === "Number" ? "number" : "text"}
                    value={params.value || ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (params.row.type === "Number" && !/^\d*$/.test(val)) return;

                        setSystemParameters((prev) =>
                            prev.map((row) =>
                                row.pk_id === params.id ? { ...row, value: val } : row
                            )
                        );
                        params.api.setEditCellValue(
                            { id: params.id, field: params.field, value: val },
                            e
                        );
                    }}
                    onBlur={() =>
                        params.api.stopCellEditMode({
                            id: params.id,
                            field: params.field,
                        })
                    }
                />
            ),
        },
        {
            field: "type",
            headerName: t('type'),
            flex: 1,
        },
        {
            field: "category",
            headerName: t('category'),
            flex: 1,
        },
    ];

    return (
        <Box sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
            {/* ===== Top Action Bar ===== */}
            <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                spacing={2}
                mb={1}
            >
                <Button
                    variant="contained"
                    startIcon={
                        saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
                    }
                    disabled={!hasChanges || saving}
                    onClick={handleSave}
                    size="small"
                    sx={{
                        borderRadius: 2,
                        px: 2,
                        boxShadow: "0 6px 18px rgba(25,118,210,0.35)",
                        textTransform: "none",
                        fontWeight: 600,
                    }}
                >
                    {saving ? t('saving') : t('save')}
                </Button>
            </Stack>

            {/* ===== DataGrid ===== */}
            <Box
                sx={{
                    flex: 1,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                }}
            >
                <DataGrid
                    rows={systemParameters}
                    columns={columns}
                    getRowId={(row) => row.pk_id}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                    }}
                    disableRowSelectionOnClick
                    onCellClick={handleCellClick}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCellEditStop={handleCellEditStop}
                    rowHeight={52}
                    density="compact"
                    sx={{
                        bgcolor: "#fff",
                        "& .MuiDataGrid-columnHeaders": {
                            background: "linear-gradient(180deg, #f9fafb, #f1f5f9)",
                            fontWeight: 700,
                        },
                        "& .MuiDataGrid-row:hover": {
                            backgroundColor: "rgba(25,118,210,0.06)",
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default SystemParameters;