import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Route, Routes, Link, useResolvedPath, useLocation } from "react-router-dom";
import { getFirestore, onSnapshot, deleteDoc, collection, getDocs, doc, updateDoc, setDoc, query, where, getDoc,addDoc } from "firebase/firestore";
import { auth } from "../firebase";
import UsersPage from './UsersPage';
import EvaluationToolsPage from './EvaluationToolsPage';
import NotificationsPage from './NotificationsPage';
import Subjects from "./Subjects";
import EvaluateSubject from './EvaluateSubject';

const AdminDashboard = () => {
const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCounts, setUserCounts] = useState({ student: 0, faculty: 0, dean: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("student");
  const [evaluationForms, setEvaluationForms] = useState({ student: [], faculty: [], dean: [] });
  const [newQuestion, setNewQuestion] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [userSubjects, setUserSubjects] = useState({});
  const [selectedUserEvaluations, setSelectedUserEvaluations] = useState([]); 
  const [subjects, setSubjects] = useState([]);// New state for evaluation reports
  const [subjectName, setSubjectName] = useState("");
  const [editSubjectName, setEditSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(""); // Add this line to define selectedSubject

  const db = getFirestore();
  const navigate = useNavigate();
  const resolvedPath = useResolvedPath("/admin");
  const location = useLocation();

  // Fetch user counts for each role
  const fetchUserCounts = useCallback(async () => {
    const roles = ["Student", "Faculty", "Dean"];
    const counts = { student: 0, faculty: 0, dean: 0 };

    for (const role of roles) {
      const q = query(collection(db, "users"), where("role", "==", role), where("status", "==", "Approved"));
      const roleSnapshot = await getDocs(q);
      counts[role.toLowerCase()] = roleSnapshot.size;
    }

    setUserCounts(counts);
  }, [db]);

  const fetchSubjects = async () => {
    try {
      const subjectsCollection = collection(db, "subjects");
      const subjectsSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleAddSubject = async (userId, subjectName) => {
    try {
      const subjectData = {
        name: subjectName,
        createdAt: new Date(),
      };
  
      const subjectRef = await addDoc(collection(db, `students/${userId}/subjects`), subjectData);
      const subjectId = subjectRef.id;
  
      // Link the evaluation form to the new subject
      const evaluationDoc = await getDoc(doc(db, "evaluations", "defaultForm")); // Assuming you have a default form
      if (evaluationDoc.exists()) {
        await setDoc(doc(db, "evaluations", subjectId), evaluationDoc.data());
      }
  
      console.log("Subject added and linked to evaluation form:", subjectId);
      setSubjectName("");
      fetchSubjects(); // Refresh subjects after adding
    } catch (error) {
      console.error("Error adding subject: ", error);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      await deleteDoc(doc(db, `students/${user.uid}/subjects`, subjectId));

      console.log("Subject deleted successfully");
    } catch (error) {
      console.error("Error deleting subject: ", error);
    }
  };

  const handleEditSubject = async (subjectId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const subjectRef = doc(db, `students/${user.uid}/subjects`, subjectId);
      await updateDoc(subjectRef, {
        name: editSubjectName,
      });

      console.log("Subject updated successfully");
      setEditSubjectName(""); // Clear input after editing
    } catch (error) {
      console.error("Error updating subject: ", error);
    }
  };
  
  // Fetch evaluations for the selected user
  const fetchEvaluationsForUser = useCallback(async (role, userId) => {
    try {
      let evaluationsQuery;
      switch (role.toLowerCase()) {
        case "student":
          evaluationsQuery = query(collection(db, "completed_evaluations", "faculty", "evaluations"), where("userId", "==", userId));
          break;
        case "faculty":
          evaluationsQuery = query(collection(db, "completed_evaluations", "dean", "evaluations"), where("userId", "==", userId));
          break;
        case "dean":
          evaluationsQuery = query(collection(db, "completed_evaluations", "dean", "evaluations"), where("userId", "==", userId));
          break;
        default:
          return [];
      }
      
      const evaluationSnapshot = await getDocs(evaluationsQuery);
      const evaluations = evaluationSnapshot.docs.map(doc => doc.data());
      setSelectedUserEvaluations(evaluations); // Store the evaluations in state
    } catch (error) {
      console.error("Error fetching evaluations:", error);
    }
  }, [db]);

  // Fetch pending users for admin approval
  const fetchPendingUsers = useCallback(async () => {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    const pendingUsersList = userSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user) => user.status === "Pending");

    setPendingUsers(pendingUsersList);
  }, [db]);

  // Fetch existing evaluation forms
  const fetchEvaluationForms = async () => {
    try {
      const forms = {};
      const subjectsCollection = collection(db, "subjects");
      const subjectsSnapshot = await getDocs(subjectsCollection);

      for (const subjectDoc of subjectsSnapshot.docs) {
        const subjectId = subjectDoc.id;
        const evaluationDoc = await getDoc(doc(db, "evaluations", subjectId));
        forms[subjectId] = evaluationDoc.exists() ? evaluationDoc.data().questions : [];
      }

      setEvaluationForms(forms);
    } catch (error) {
      console.error("Error fetching evaluation forms:", error);
    }
  };

  // Check if the user has completed all required evaluations
  const checkEvaluationCompletion = async (role, userId) => {
    let evaluationsQuery;

    switch (role) {
      case "Student":
        evaluationsQuery = query(collection(db, "completed_evaluations", "faculty", "evaluations"), where("userId", "==", userId));
        break;
      case "Faculty":
        evaluationsQuery = query(collection(db, "completed_evaluations", "dean", "evaluations"), where("userId", "==", userId));
        break;
      case "Dean":
        evaluationsQuery = query(collection(db, "completed_evaluations", "jeff", "evaluations"), where("userId", "==", userId));
        break;
      default:
        return false;
    }

    const evaluationSnapshot = await getDocs(evaluationsQuery);
    return !evaluationSnapshot.empty; // Return true if evaluations are found, false otherwise
  };

  const fetchUserSubjects = useCallback(async (role, userId) => {
    try {
      const collectionPath = role === "Student" ? `students/${userId}/subjects` : `${role.toLowerCase()}/${userId}/subjects`;
      const subjectsRef = collection(db, collectionPath);
      const subjectSnapshot = await getDocs(subjectsRef);
      const subjects = subjectSnapshot.docs.map(doc => doc.data().name);
      return subjects;
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }
  }, [db]);

  const fetchUsersWithSubjects = useCallback(async (role) => {
    try {
      const q = query(collection(db, "users"), where("role", "==", role), where("status", "==", "Approved"));
      const roleSnapshot = await getDocs(q);
      const usersList = [];
      const subjectsList = {};
  
      for (const doc of roleSnapshot.docs) {
        const userData = doc.data();
        const userId = doc.id;
        const subjects = await fetchUserSubjects(role, userId);
        usersList.push({ id: userId, ...userData });
        subjectsList[userId] = subjects;
      }
  
      setUsers(usersList);
      setUserSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching users with subjects:", error);
    }
  }, [fetchUserSubjects]);

  useEffect(() => {
    const checkAdminRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "Admin") {
        setIsAdmin(true);
        await fetchSubjects(); // Fetch subjects on load
        await fetchEvaluationForms(); // Fetch existing evaluation forms
      } else {
        navigate("/");
      }
      setLoading(false);
    };
    checkAdminRole();
  }, [navigate]);

  const handleApproveUser = async (userId) => {
    await updateDoc(doc(db, "users", userId), {
      status: "Approved",
    });
    setPendingUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    alert("User approved successfully!");
    await fetchUserCounts(); // Refresh user counts after approval
  };

  const handleRejectUser = async (userId) => {
    await updateDoc(doc(db, "users", userId), {
      status: "Rejected",
    });
    setPendingUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    alert("User rejected.");
  };

  const handleRoleClick = async (role) => {
    setSelectedRole(role.toLowerCase());
    await fetchUsersWithSubjects(role);
  };

  const handleUserClick = async (role, userId) => {
    await fetchEvaluationsForUser(role, userId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query.");
      return;
    }
  
    const normalizedQuery = searchQuery.toLowerCase();
  
    try {
      // Query for users by first name
      const firstNameQuery = query(
        collection(db, "users"),
        where("firstName", ">=", normalizedQuery),
        where("firstName", "<=", normalizedQuery + "\uf8ff"),
        where("status", "==", "Approved") // Ensuring only approved users
      );
  
      const firstNameSnapshot = await getDocs(firstNameQuery);
  
      const searchResults = [];
  
      firstNameSnapshot.forEach((doc) => {
        searchResults.push({ id: doc.id, ...doc.data() });
      });
  
      if (searchResults.length === 0) {
        console.log("No users found with the given first name.");
      }
  
      setUsers(searchResults); // Update state with the search results
    } catch (error) {
      console.error("Error performing search:", error);
    }
  };

  // Handle adding a new question to the evaluation form
  
  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    setEvaluationForms((prevForms) => ({
      ...prevForms,
      [selectedSubject]: [...(prevForms[selectedSubject] || []), { text: newQuestion }],
    }));
    setNewQuestion("");
  };


  // Handle deleting a question from the evaluation form
  const deleteQuestion = (index) => {
    setEvaluationForms((prevForms) => {
      const updatedQuestions = prevForms[selectedSubject].filter((_, i) => i !== index);
      return {
        ...prevForms,
        [selectedSubject]: updatedQuestions,
      };
    });
  };

  const addSubject = useCallback(async (userId, newSubject) => {
    try {
      const subjectsRef = collection(db, `users/${userId}/subjects`);
      await setDoc(doc(subjectsRef), { name: newSubject });
      setUserSubjects((prevSubjects) => ({
        ...prevSubjects,
        [userId]: [...(prevSubjects[userId] || []), newSubject],
      }));
      alert("Subject added successfully!");
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  }, [db]);
  

  // Define the deleteSubject function
  const deleteSubject = useCallback(async (userId, subjectName) => {
    try {
      const subjectsRef = collection(db, `users/${userId}/subjects`);
      const subjectQuery = query(subjectsRef, where("name", "==", subjectName));
      const subjectSnapshot = await getDocs(subjectQuery);
      if (!subjectSnapshot.empty) {
        const subjectDoc = subjectSnapshot.docs[0];
        await updateDoc(subjectDoc.ref, { name: subjectName });
        setUserSubjects((prevSubjects) => ({
          ...prevSubjects,
          [userId]: prevSubjects[userId].filter((subject) => subject !== subjectName),
        }));
        alert("Subject deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  }, [db]);

  // Define the editSubject function
  const editSubject = useCallback(async (userId, oldSubjectName, newSubjectName) => {
    try {
      const subjectsRef = collection(db, `users/${userId}/subjects`);
      const subjectQuery = query(subjectsRef, where("name", "==", oldSubjectName));
      const subjectSnapshot = await getDocs(subjectQuery);
      if (!subjectSnapshot.empty) {
        const subjectDoc = subjectSnapshot.docs[0];
        await updateDoc(subjectDoc.ref, { name: newSubjectName });
        setUserSubjects((prevSubjects) => ({
          ...prevSubjects,
          [userId]: prevSubjects[userId].map((subject) =>
            subject === oldSubjectName ? newSubjectName : subject
          ),
        }));
        alert("Subject updated successfully!");
      }
    } catch (error) {
      console.error("Error editing subject:", error);
    }
  }, [db]);


  // Handle saving the evaluation form to Firestore
  const handleSaveForm = async () => {
    if (!selectedSubject) {
      alert("Please select a subject");
      return;
    }
    const formRef = doc(db, "evaluationForms", selectedSubject);
    await setDoc(formRef, { questions: evaluationForms[selectedSubject] || [] });
    alert("Evaluation form saved successfully!");
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return <p>Access Denied</p>;
  }

  return (
    <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome, Admin! Here you can manage users, evaluation forms, and more.</p>

    <nav>
      <ul>
      <li><Link to="users">Users</Link></li>
          <li><Link to="evaluation-tools">Evaluation Tools</Link></li>
          <li><Link to="notifications">Notifications</Link></li>
          <li><Link to="subjects">Subjects</Link></li> {/* New Link for Subjects */}
          
      </ul>
    </nav>

    <Routes>
        <Route path="users" element={<UsersPage 
                                 handleRoleClick={handleRoleClick}
                                 handleUserClick={handleUserClick}
                                 handleSearch={handleSearch}
                                 userCounts={userCounts}
                                 searchQuery={searchQuery}
                                 users={users}
                                 userSubjects={userSubjects}
                                 setSubjectName={setSubjectName}  // Pass setSubjectName
                                 subjectName={subjectName}  
                                 addSubject={addSubject}
                                 deleteSubject={deleteSubject}
                                 editSubject={editSubject}
                                 setSubjects={setSubjects}
                                 handleAddSubject={handleAddSubject} // Add this line
                                 handleDeleteSubject={handleDeleteSubject} // Add this line
                                 handleEditSubject={handleEditSubject} // Add this line
                                 setSearchQuery={setSearchQuery}
                                 subjects={subjects} // Pass subjects
                               />} 
        />
        <Route path="evaluation-tools" element={<EvaluationToolsPage
            selectedUserEvaluations={[]}
            evaluationForms={evaluationForms}
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            deleteQuestion={deleteQuestion}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            addQuestion={addQuestion}
            handleSaveForm={handleSaveForm}
       
          />} 
        />
        <Route path="notifications" element={<NotificationsPage 
                                               pendingUsers={pendingUsers} 
                                               handleApproveUser={handleApproveUser}
                                               handleRejectUser={handleRejectUser}
                                             />} 
        />
    <Route path="subjects" element={<Subjects />} /> {/* New Route for Subjects */}
    <Route path="evaluate-subject/:subjectId" element={<EvaluateSubject />} />
      </Routes>
  </div>
  );
};

export default AdminDashboard;