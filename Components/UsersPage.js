// File path: ./src/UsersPage.js

import React, { useState } from 'react';

const UsersPage = ({
  handleRoleClick,
  handleUserClick,
  handleSearch,
  userCounts,
  searchQuery,
  users,
  userSubjects,
  setSearchQuery
}) => {
  const [selectedRole, setSelectedRole] = useState("student");

  return (
    <div>
      <h2>User Counts</h2>
      <p>Students: {userCounts.student || 0}</p>
      <p>Faculty: {userCounts.faculty || 0}</p>
      <p>Deans: {userCounts.dean || 0}</p>
      <button onClick={() => handleRoleClick("Student")}>View Students</button>
      <button onClick={() => handleRoleClick("Faculty")}>View Faculty</button>
      <button onClick={() => handleRoleClick("Dean")}>View Deans</button>

      <h2>Search Users</h2>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by first name"
      />
      <button onClick={handleSearch}>Search</button>

      <h2>Users List</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id} onClick={() => handleUserClick(user.role, user.id)}>
              {user.firstName} {user.lastName} - {user.role} ({user.status}) - Evaluation Completed: {user.hasCompletedEvaluation ? "Yes" : "No"}
              <br />
              Subjects: {userSubjects[user.id]?.join(", ") || "No subjects"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UsersPage;
