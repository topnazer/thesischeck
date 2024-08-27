import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const EvaluateSubject = () => {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
        if (subjectDoc.exists()) {
          setSubject(subjectDoc.data());
        } else {
          setError("Subject not found");
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          setError("You do not have permission to view this subject.");
        } else {
          setError("Error fetching subject: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchEvaluationForm = async () => {
      try {
        const evaluationDoc = await getDoc(doc(db, "evaluations", "student"));
        if (evaluationDoc.exists()) {
          setEvaluationForm(evaluationDoc.data().questions);
        } else {
          setError("No evaluation form found for student.");
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          setError("You do not have permission to view the evaluation form.");
        } else {
          setError("Error fetching evaluation form: " + error.message);
        }
      }
    };

    fetchSubject();
    fetchEvaluationForm();
  }, [db, subjectId]);

  if (loading) {
    return <p>Loading subject data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Evaluate {subject.name}</h1>
      <form>
        {evaluationForm.map((question, index) => (
          <div key={index}>
            {/* Assuming each question is an object with a 'text' property */}
            <label>{question.text}</label>
            <input type="text" name={`question-${index}`} />
          </div>
        ))}
        <button type="submit">Submit Evaluation</button>
      </form>
    </div>
  );
};

export default EvaluateSubject;
