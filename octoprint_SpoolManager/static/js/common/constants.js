/**
 * Defined without specifier to be globally accessible
 */
SPOOLMANAGER_CONSTANTS = {
    MATERIALS_DENSITY_MAPPING: {
        PLA:        1.24,
        PLA_plus:	1.24,
        ABS:        1.04,
        PETG:       1.27,
        NYLON:      1.52,
        TPU:        1.21,
        PC:         1.3,
        Wood:       1.28,
        Carbon:	    1.3,
        PC_ABS:	    1.19,
        HIPS:       1.03,
        PVA:        1.23,
        ASA:        1.05,
        PP:         0.9,
        POM:        1.4,
        PMMA:       1.18,
        FPE:        2.16
    },
    DATES: {
        DISPLAY_FORMATS: {
            DATETIME_LOCAL: "YYYY-MM-DDTHH:mm",
            DATE: "YYYY-MM-DD",
        },
        PARSE_FORMATS: {
            DATETIME: "DD.MM.YYYY HH:mm",
            DATE: "DD.MM.YYYY",
        },
    },
    FILAMENT_STATS_CALC_MODES: {
        FILAMENT: "filament",
        COMBINED: "spool+filament",
        SPOOL: "spool",
    },
    DOM_SELECTORS: {
        SPOOL_DIALOG: "#dialog_spool_edit",
    },
};
