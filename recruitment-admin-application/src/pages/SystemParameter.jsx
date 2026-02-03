import SYSTEM_PARAMETER_TRANSLATIONS from "../translations/systemParameters";
import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Stack,
    Checkbox,
    TextField
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../services/api";



const SystemParameters = () => {
    const [systemParameters, setSystemParameters] = useState([]);

    const handleCellEditStop = useCallback((params) => {
        setSystemParameters((prev) =>
            prev.map((row) =>
                row.pk_id === params.id ? { ...row, [params.field]: params.value } : row
            )
        );
    }, []);

    const handleCellClick = useCallback((params, event) => {
        if (params.field === "value" && params.row.type !== "Boolean") {
            // Only start edit mode if the cell is not already in edit mode
            if (params.api.getCellMode(params.id, params.field) !== "edit") {
                event.defaultMuiPrevented = true;
                params.api.startCellEditMode({ id: params.id, field: params.field });
            }
        }
    }, []);

    const handleCellDoubleClick = useCallback((params, event) => {
        if (params.field === "value" && params.row.type !== "Boolean") {
            // Only start edit mode if the cell is not already in edit mode
            if (params.api.getCellMode(params.id, params.field) !== "edit") {
                event.defaultMuiPrevented = true;
                params.api.startCellEditMode({ id: params.id, field: params.field });
            }
        }
    }, []);

    const fetchSystemParameters = async () => {
        try {
            const res = await api.get("/global/parameter");
            setSystemParameters(res.data || []);
        } catch (err) {
            console.error("Failed to load system parameters", err);
        }

    };

    useEffect(() => {
        fetchSystemParameters();
    }, []);


    /* ================= Columns ================= */
    const columns = [
        {
            field: "name",
            headerName: "Name",
            flex: 2,
            filterable: false,
            valueGetter: (value, row) =>
                SYSTEM_PARAMETER_TRANSLATIONS[value] || value,
        },

        {
            field: "value",
            headerName: "Value",
            width: 200,
            editable: true,
            renderCell: (params) => {
                if (params.row.type === "Boolean") {
                    return (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                marginLeft: -10,
                            }}
                        >
                            <Checkbox
                                checked={params.value === true || params.value === "True"}
                                onChange={(e) => {
                                    const newVal = e.target.checked;
                                    setSystemParameters((prev) =>
                                        prev.map((row) =>
                                            row.pk_id === params.id ? { ...row, value: newVal } : row
                                        )
                                    );
                                }}
                            />
                        </div>

                    );
                }
                return <span>{params.value}</span>;
            },
            renderEditCell: (params) => {
                if (params.row.type === "Boolean") {
                    return (
                        <Checkbox
                            autoFocus
                            checked={params.value === true || params.value === "True"}
                            onChange={(e) => {
                                const newVal = e.target.checked;
                                setSystemParameters((prev) =>
                                    prev.map((row) =>
                                        row.pk_id === params.id ? { ...row, value: newVal } : row
                                    )
                                );
                                if (params.api.getCellMode(params.id, params.field) === "edit") {
                                    params.api.stopCellEditMode({ id: params.id, field: params.field });
                                }
                            }}
                        />
                    );
                }

                return (
                    <TextField
                        autoFocus
                        fullWidth
                        variant="standard"
                        type={params.row.type === "Number" ? "number" : "text"}
                        value={params.value || ""}
                        sx={{
                            marginBottom: -1,
                        }}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (params.row.type === "Number" && !/^\d*$/.test(val)) return;

                            // Update parameterData directly
                            setSystemParameters((prev) =>
                                prev.map((row) =>
                                    row.pk_id === params.id ? { ...row, value: val } : row
                                )
                            );
                            params.api.setEditCellValue({ id: params.id, field: params.field, value: val }, e);
                        }}
                        onBlur={() => {
                            if (params.api.getCellMode(params.id, params.field) === "edit") {
                                params.api.stopCellEditMode({ id: params.id, field: params.field });
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && params.api.getCellMode(params.id, params.field) === "edit") {
                                params.api.stopCellEditMode({ id: params.id, field: params.field });
                            }
                        }}
                    />
                );
            },
        },
        { field: "type", headerName: "Type", flex: 1 },
    ];

    return (
        <>
            <Box
                sx={{
                    height: "calc(100vh - 100px)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Top Bar */}
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={2}
                    mb={1}
                >

                </Stack>

                {/* DataGrid */}
                <Box
                    sx={{
                        flex: 1,
                        border: "3px solid",
                        borderColor: "divider",
                        borderRadius: 4,
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
                        }}
                    />
                </Box>
            </Box>
        </>
    );
};

export default SystemParameters;
