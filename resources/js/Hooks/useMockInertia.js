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
        name: ["DELA CRUZ, JUAN", "SANTOS, MARIA", "REYES, JOSE", "DIZON, ANA"][i % 4] + ` ${i + 1}`,
        program_duration: duration, // Used to calculate headers dynamically
        grades: grades // Object containing { "1Y-1S": "1.25", "1Y-2S": "1.50" ... }
    };
});