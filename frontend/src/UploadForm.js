import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Upload({ currentUser }) {
  const navigate = useNavigate();

  // Unit 3: State Management for Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: 'BCA',
    year: '1',
    semester: '1',
    subject: '',
    file_url: ''
  });

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // We combine the form data with the logged-in student's name
    const uploadData = { 
      ...formData, 
      student_name: currentUser 
    };

    console.log("Attempting to upload:", uploadData);

    axios.post('https://campus-share-api-cfal.onrender.com/api/materials', uploadData)
      .then(response => {
        alert("🎉 Material Uploaded Successfully!");
        navigate('/'); // Redirect to Dashboard after success
      })
      .catch(error => {
        console.error("Upload Error Details:", error.response ? error.response.data : error.message);
        alert("❌ Failed to upload. Check if your Node server and XAMPP MySQL are running.");
      });
  };

  // Material Design Styles
  const containerStyle = {
    maxWidth: '550px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    fontFamily: 'inherit'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'background 0.3s'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '5px' }}>📤 Upload Study Material</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px' }}>
        Logged in as: <strong style={{ color: '#1976d2' }}>{currentUser}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <label><strong>Material Title</strong></label>
        <input 
          type="text" name="title" 
          placeholder="e.g. Unit 1 Java Notes" 
          required onChange={handleChange} style={inputStyle} 
        />

        <label><strong>Description (Optional)</strong></label>
        <textarea 
          name="description" 
          placeholder="What is inside this file?" 
          onChange={handleChange} 
          style={{ ...inputStyle, height: '80px', resize: 'none' }} 
        />

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label><strong>Course</strong></label>
            <select name="course" onChange={handleChange} style={inputStyle}>
              <option value="BCA">BCA</option>
              <option value="B.Tech">B.Tech</option>
              <option value="BBA">BBA</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label><strong>Year</strong></label>
            <select name="year" onChange={handleChange} style={inputStyle}>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>

        <label><strong>Semester</strong></label>
        <select name="semester" onChange={handleChange} style={inputStyle}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>Semester {num}</option>
          ))}
        </select>

        <label><strong>Subject</strong></label>
        <input 
          type="text" name="subject" 
          placeholder="e.g. Data Structures" 
          required onChange={handleChange} style={inputStyle} 
        />

        <label><strong>Document Link (Google Drive / Dropbox)</strong></label>
        <input 
          type="url" name="file_url" 
          placeholder="https://drive.google.com/..." 
          required onChange={handleChange} style={inputStyle} 
        />

        <button 
          type="submit" 
          style={buttonStyle}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
        >
          Publish Material
        </button>
      </form>
    </div>
  );
}

export default Upload;