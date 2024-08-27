import React from 'react';

const NotificationsPage = ({ pendingUsers = [], handleApproveUser, handleRejectUser }) => { // Default pendingUsers to an empty array
  return (
    <div>
      <h2>Pending User Registrations</h2>
      {pendingUsers.length === 0 ? (
        <p>No pending users to approve.</p>
      ) : (
        <ul>
          {pendingUsers.map((user) => (
            <li key={user.id}>
              {user.firstName} {user.lastName} - {user.role} ({user.email})
              <button onClick={() => handleApproveUser(user.id)}>Approve</button>
              <button onClick={() => handleRejectUser(user.id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
