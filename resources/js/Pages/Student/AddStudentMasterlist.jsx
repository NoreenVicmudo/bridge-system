import React, { useState } from "react";
// Import your reusable components
import TableContainer from "@/Components/Table/DataTable";
import Pagination from "@/Components/Table/Pagination";
import Modal from "@/Components/Modal"; // Assuming you have a basic Modal
import { getDummyStudents } from "@/Mocks/studentData"; // Your Dummy Data

export default function StudentIndex() {
    // 1. SIMULATE BACKEND DATA
    // In real life, 'students' comes from props: export default function StudentIndex({ students })
    const [page, setPage] = useState(1);
    const students = getDummyStudents(page);

    // 2. FRONTEND STATE (Search, Modals)
    const [search, setSearch] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [metric, setMetric] = useState("basic"); // 'basic' or 'detailed'

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <TableContainer
                title="Student Masterlist"
                search={search}
                onSearch={setSearch}
                actions={
                    <>
                        {/* The "Filter" Button */}
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className="px-4 py-2 bg-white border rounded hover:bg-gray-50 text-sm font-medium"
                        >
                            <i className="fa fa-filter mr-2"></i> Filters
                        </button>

                        {/* The "Metric" Toggle (Example) */}
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value)}
                            className="border rounded px-3 py-2 text-sm bg-white"
                        >
                            <option value="basic">Basic View</option>
                            <option value="detailed">Detailed View</option>
                        </select>
                    </>
                }
            >
                {/* THE ACTUAL TABLE */}
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-purple-50 text-purple-900 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Student No.</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">College</th>
                            {metric === "detailed" && (
                                <th className="px-6 py-3">Status</th>
                            )}
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.data.map((student) => (
                            <tr
                                key={student.id}
                                className="hover:bg-purple-50/50"
                            >
                                <td className="px-6 py-4 font-medium">
                                    {student.student_number}
                                </td>
                                <td className="px-6 py-4 text-gray-900 font-semibold">
                                    {student.name}
                                </td>
                                <td className="px-6 py-4">{student.college}</td>

                                {/* Conditional Metric Column */}
                                {metric === "detailed" && (
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${
                                                student.status === "Regular"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                            {student.status}
                                        </span>
                                    </td>
                                )}

                                <td className="px-6 py-4">
                                    <button className="text-purple-600 hover:underline">
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* PAGINATION */}
                {/* Note: In real app, links handles the click. Here we mock it via setPage for demo */}
                <div onClick={() => setPage(page < 5 ? page + 1 : 1)}>
                    <Pagination links={students.links} />
                </div>
            </TableContainer>

            {/* MODALS */}
            <Modal
                show={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Filter Students</h3>
                    {/* Filter form goes here */}
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowFilterModal(false)}
                            className="text-gray-500"
                        >
                            Cancel
                        </button>
                        <button className="bg-purple-900 text-white px-4 py-2 rounded">
                            Apply
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
