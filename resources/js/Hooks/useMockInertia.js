import { useState, useMemo } from "react";

export function useMockInertia(allData, perPage = 10) {
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // --- NEW SORT STATE ---
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc"); // "asc" or "desc"

    // 1. Filter Data
    const filteredData = useMemo(() => {
        if (!search) return allData;
        const lowerSearch = search.toLowerCase();
        return allData.filter((row) =>
            Object.values(row).some((val) =>
                String(val).toLowerCase().includes(lowerSearch),
            ),
        );
    }, [search, allData]);

    // 2. Sort Data (NEW STEP)
    const sortedData = useMemo(() => {
        if (!sortColumn) return filteredData;

        return [...filteredData].sort((a, b) => {
            const valA = a[sortColumn];
            const valB = b[sortColumn];

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortColumn, sortDirection]);

    // 3. Paginate Data (Uses sortedData instead of filteredData)
    const paginatedResult = useMemo(() => {
        const total = sortedData.length;
        const lastPage = Math.ceil(total / perPage) || 1;
        const validPage = Math.min(Math.max(1, currentPage), lastPage);
        const from = (validPage - 1) * perPage;
        const to = from + perPage;
        const pageData = sortedData.slice(from, to);

        const links = [
            {
                url: validPage > 1 ? "#" : null,
                label: "&laquo;",
                active: false,
                page: validPage - 1,
            },
            ...Array.from({ length: lastPage }, (_, i) => ({
                url: "#",
                label: (i + 1).toString(),
                active: i + 1 === validPage,
                page: i + 1,
            })),
            {
                url: validPage < lastPage ? "#" : null,
                label: "&raquo;",
                active: false,
                page: validPage + 1,
            },
        ];

        return {
            data: pageData,
            links: links,
            current_page: validPage,
            from: total === 0 ? 0 : from + 1,
            to: Math.min(to, total),
            total: total,
        };
    }, [sortedData, currentPage, perPage]);

    // Helper to toggle sort (Tri-State: Asc -> Desc -> None)
    const handleSort = (column) => {
        if (sortColumn === column) {
            // If already sorting by this column...
            if (sortDirection === "asc") {
                // 1. Switch to Descending
                setSortDirection("desc");
            } else {
                // 2. Was Descending? Now Reset (Remove Sort)
                setSortColumn(null);
                setSortDirection("asc"); // Reset direction default
            }
        } else {
            // 3. New Column? Start with Ascending
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    return {
        data: paginatedResult,
        search,
        setSearch,
        setPage: setCurrentPage,
        // Export Sort Helpers
        sortColumn,
        sortDirection,
        handleSort,
    };
}

// ... (MOCK_STUDENTS remains the same)
export const MOCK_STUDENTS = Array.from({ length: 45 }).map((_, i) => ({
    id: i + 1,
    student_number: `2022${30000 + i}`,
    name:
        ["DELA CRUZ, JUAN", "SANTOS, MARIA", "REYES, JOSE", "DIZON, ANA"][
            i % 4
        ] + ` ${i + 1}`,
    college: "COLLEGE OF MEDICAL TECHNOLOGY",
    program: "BS MEDICAL TECHNOLOGY",
    age: 20 + (i % 5),
    sex: i % 2 === 0 ? "MALE" : "FEMALE",
    socioeconomic: ["POOR", "MIDDLE CLASS", "LOW INCOME"][i % 3],
    address: `${100 + i} Rizal St, Barangay ${i}, Caloocan City, Metro Manila`,
    living_arrangement: ["With Parents", "Boarding House", "Relative"][i % 3],
    work_status: i % 4 === 0 ? "Working Student" : "Unemployed",
    scholarship: i % 5 === 0 ? "Academic Scholar" : "None",
    language: "Filipino/Tagalog",
    last_school: "MCU Senior High School",
}));

// ACADEMIC PROFILE
// EXPANDED MOCK DATA FOR GWA ACADEMIC PROFILE
export const MOCK_STUDENTS_GWA = Array.from({ length: 45 }).map((_, i) => {
    // Determine program duration (some are 4 years, some 5)
    const duration = i % 3 === 0 ? 5 : 4;

    // Generate GWA scores for each semester dynamically
    const grades = {};
    for (let year = 1; year <= duration; year++) {
        grades[`${year}Y-1S`] = (1.0 + Math.random() * 1.5).toFixed(2); // Random grade 1.00 - 2.50
        grades[`${year}Y-2S`] = (1.0 + Math.random() * 1.5).toFixed(2);
    }

    return {
        id: i + 1,
        student_number: `2022${30000 + i}`,
        name:
            ["DELA CRUZ, JUAN", "SANTOS, MARIA", "REYES, JOSE", "DIZON, ANA"][
                i % 4
            ] + ` ${i + 1}`,
        program_duration: duration, // Used to calculate headers dynamically
        grades: grades, // Object containing { "1Y-1S": "1.25", "1Y-2S": "1.50" ... }
    };
});

// 1. MOCK DATA FOR BOARD SUBJECTS
export const MOCK_BOARD_SUBJECTS = [
    "Hematology 1",
    "Clinical Chemistry 1",
    "Microbiology",
    "Immunology & Serology",
    "Histopathologic Techniques",
];

// 2. MOCK STUDENT DATA WITH BOARD GRADES
export const MOCK_STUDENTS_BOARD = Array.from({ length: 45 }).map((_, i) => {
    // Generate random grades for each subject
    const grades = {};
    MOCK_BOARD_SUBJECTS.forEach((subject) => {
        // Random grade between 75 and 99, or null (empty)
        grades[subject] =
            Math.random() > 0.1
                ? (75 + Math.floor(Math.random() * 24)).toString()
                : null;
    });

    return {
        id: i + 1,
        student_number: `2022${30000 + i}`,
        name: [
            "ALONSO, TRES NUMERO",
            "PROTACIO, QUATRO NUMERO",
            "ONOR, CINCO NUMERO",
            "PILAPIL, SAIS NUMERO",
        ][i % 4],
        college: "COLLEGE OF MEDICAL TECHNOLOGY",
        program: "BS MEDICAL TECHNOLOGY",
        grades: grades, // Object { "Hematology 1": "85", ... }
    };
});

// 3. MOCK DATA FOR RETAKES (Matches screenshot image_07801e.png)
export const MOCK_RETAKE_SUBJECTS = [
    "ANAPHY",
    "CHEM",
    "PHYSICS", // Added for demo
    "ALGEBRA", // Added for demo
];

export const MOCK_STUDENTS_RETAKES = Array.from({ length: 30 }).map((_, i) => {
    // Generate random retake counts (0 or 1) for demo
    const grades = {};
    MOCK_RETAKE_SUBJECTS.forEach((subject) => {
        grades[subject] = Math.floor(Math.random() * 2).toString(); // 0 or 1
    });

    return {
        id: i + 1,
        student_number: `2015${30000 + i}`, // ID format from screenshot
        name: [
            "BAUTISTA, JUAN DELA CRUZ",
            "GUTIERREZ, JUAN FERNANDEZ IV",
            "CASTILLO, KATRINA TORRES",
        ][i % 3],
        college: "COLLEGE OF ARTS AND SCIENCES",
        program: "BS PSYCHOLOGY",
        grades: grades, // e.g. { "ANAPHY": "0", "CHEM": "0" }
    };
});

// 4. MOCK DATA FOR PERFORMANCE RATING
export const MOCK_PERFORMANCE_CATEGORIES = [
    "Clinical Performance",
    "Theoretical Knowledge",
    "Attitude & Behavior",
    "Attendance",
];

export const MOCK_STUDENTS_PERFORMANCE = Array.from({ length: 40 }).map(
    (_, i) => {
        // Generate random ratings (e.g., 1.0 to 5.0 scale or 75-100)
        // Assuming a grade-like scale for performance (e.g., 85, 92)
        const ratings = {};
        MOCK_PERFORMANCE_CATEGORIES.forEach((cat) => {
            ratings[cat] = (75 + Math.floor(Math.random() * 25)).toString();
        });

        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            ratings: ratings, // e.g. { "Clinical Performance": "92", ... }
        };
    },
);

// 5. MOCK DATA FOR SIMULATION EXAMS
export const MOCK_SIMULATION_EXAMS = [
    "MTAP 1",
    "MTAP 2",
    "Pre-Board 1",
    "Pre-Board 2",
];

export const MOCK_STUDENTS_SIMULATION = Array.from({ length: 40 }).map(
    (_, i) => {
        // Generate random scores (e.g., 0-100)
        const results = {};
        MOCK_SIMULATION_EXAMS.forEach((exam) => {
            // Random score between 40 and 95, or null
            results[exam] =
                Math.random() > 0.1
                    ? Math.floor(40 + Math.random() * 56).toString()
                    : null;
        });

        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            results: results, // e.g. { "MTAP 1": "82", "Pre-Board 1": "75" }
        };
    },
);

// 6. MOCK DATA FOR ATTENDANCE
// Unlike other tables, this one doesn't have dynamic columns in the screenshot provided.
// It just shows "Sessions Attended" and "Total Sessions".
export const MOCK_STUDENTS_ATTENDANCE = Array.from({ length: 40 }).map(
    (_, i) => {
        // Random Total Sessions (e.g., 20 or 30)
        const totalSessions = i % 2 === 0 ? 20 : 30;

        // Random Attended (between 50% and 100% of total)
        const attended = Math.floor(
            totalSessions * (0.5 + Math.random() * 0.5),
        );

        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            attended: attended, // e.g. 18
            total: totalSessions, // e.g. 20
        };
    },
);

// 7. MOCK DATA FOR ACADEMIC RECOGNITION
// Columns: Student ID, Name, Dean's List Count (Frequency)
export const MOCK_STUDENTS_RECOGNITION = Array.from({ length: 40 }).map(
    (_, i) => {
        // Generate random frequency: 0 means no award, 1-8 means frequency
        // Weighted so some have 0 (displayed as -)
        const frequency =
            Math.random() > 0.3 ? Math.ceil(Math.random() * 6) : 0;

        return {
            id: i + 1,
            student_number: `2022${30000 + i}`,
            name: [
                "ALONSO, TRES NUMERO",
                "PROTACIO, QUATRO NUMERO",
                "ONOR, CINCO NUMERO",
                "PILAPIL, SAIS NUMERO",
                "ONDA, NUEBE NUMERO",
            ][i % 5],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            recognition_count: frequency, // e.g. 5, 2, 0
        };
    },
);

/////PROGRAM METRICS

// 8. MOCK DATA FOR REVIEW CENTER
export const MOCK_STUDENTS_REVIEW_CENTER = Array.from({ length: 40 }).map(
    (_, i) => {
        const centers = [
            "Lemar Review Hub",
            "Pioneer Review Center",
            "ACTS Review Center",
            "Top Rank Academy",
            "None",
        ];
        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            review_center: centers[Math.floor(Math.random() * centers.length)],
        };
    },
);

// 9. MOCK DATA FOR MOCK EXAM SCORES (Updated Format: Score/Total)
export const MOCK_MOCK_SUBJECTS = [
    "Clinical Chemistry",
    "Hematology",
    "Microbiology",
    "Immunology & Serology",
];

export const MOCK_STUDENTS_MOCK_SCORES = Array.from({ length: 40 }).map(
    (_, i) => {
        const scores = {};
        MOCK_MOCK_SUBJECTS.forEach((sub) => {
            // Random total items (e.g., 100, 110, 120)
            const total = [100, 110, 120][Math.floor(Math.random() * 3)];
            // Random score (e.g., 70 to Total)
            const score = Math.floor(total * (0.6 + Math.random() * 0.35)); // 60% to 95% range

            // Format: "88/100"
            scores[sub] = Math.random() > 0.1 ? `${score}/${total}` : null;
        });

        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            scores: scores, // e.g. { "Clinical Chemistry": "88/100" }
        };
    },
);

// 10. MOCK DATA FOR LICENSURE EXAM RESULTS
export const MOCK_STUDENTS_LICENSURE = Array.from({ length: 40 }).map(
    (_, i) => {
        // Random Status: Passed or Failed
        const status = Math.random() > 0.3 ? "Passed" : "Failed";
        // Random First Attempt: Yes or No
        const firstAttempt = Math.random() > 0.2 ? "Yes" : "No";
        // Random Date within last 2 years
        const date = new Date(
            Date.now() - Math.floor(Math.random() * 63072000000),
        ).toLocaleDateString();

        return {
            id: i + 1,
            student_number: `2015${30000 + i}`,
            name: [
                "BAUTISTA, JUAN DELA CRUZ",
                "GUTIERREZ, JUAN FERNANDEZ IV",
                "CASTILLO, KATRINA TORRES",
                "ALONSO, TRES NUMERO",
            ][i % 4],
            college: "COLLEGE OF MEDICAL TECHNOLOGY",
            program: "BS MEDICAL TECHNOLOGY",
            exam_date: date,
            status: status,
            first_attempt: firstAttempt,
        };
    },
);
