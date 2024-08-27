// File path: ./src/EvaluationToolsPage.js

import React, { useState } from "react";

const EvaluationToolsPage = ({
  selectedUserEvaluations,
  evaluationForms,
  subjects, // Pass subjects list
  selectedSubject,
  setSelectedSubject,
  deleteQuestion,
  newQuestion,
  setNewQuestion,
  addQuestion,
  handleSaveForm,
}) => {
  return (
    <div>
      <h2>Evaluation Reports</h2>
      {selectedUserEvaluations.length === 0 ? (
        <p>No evaluations found for the selected user.</p>
      ) : (
        <ul>
          {selectedUserEvaluations.map((evaluation, index) => (
            <li key={index}>
              <p>Score: {evaluation.percentageScore}%</p>
              <p>Details: {evaluation.scores.join(", ")}</p>
            </li>
          ))}
        </ul>
      )}

<h2>Create or Edit Evaluation Form for Subjects</h2>
      <label htmlFor="subjectSelect">Select Subject:</label>
      <select
        id="subjectSelect"
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
      >
        <option value="" disabled>Select a subject</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>

      {selectedSubject && (
        <div>
          <ul>
            {(evaluationForms[selectedSubject] || []).map((question, index) => (
              <li key={index}>
                {question.text}
                <button onClick={() => deleteQuestion(index)}>Delete</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Add a new question"
          />
          <button onClick={addQuestion}>Add Question</button>
          <button onClick={handleSaveForm}>Save Form</button>
        </div>
      )}
    </div>
  );
};

export default EvaluationToolsPage;
