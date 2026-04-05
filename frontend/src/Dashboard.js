import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ currentUser }) { 
  const [materials, setMaterials] = useState([]);
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');

  const fetchMaterials = () => {
    const queryParams = new URLSearchParams({
      course: filterCourse,
      year: filterYear,
      semester: filterSemester
    }).toString();

    axios.get(`https://campus-share-api-cfal.onrender.com/api/materials?${queryParams}`)
      .then(response => setMaterials(response.data))
      .catch(error => console.error("Error fetching data: ", error));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete your notes?")) {
      const loggedInUser = currentUser ? currentUser.trim() : "";
      
      axios.delete(`https://campus-share-api-cfal.onrender.com/api/materials/${id}?student_name=${loggedInUser}`)
        .then(() => {
          alert("🗑️ Material removed successfully!");
          fetchMaterials(); 
        })
        .catch(error => {
          console.error("Delete error:", error);
          const msg = error.response?.data?.error || "You can only delete your own uploads.";
          alert("Error: " + msg);
        });
    }
  };

  // ==========================================
  // --- NEW: RATING & REPORTING FUNCTIONS ---
  // ==========================================

const handleRate = async (materialId, score) => {
    try {
      // 1. Check if user is logged in using the prop
      if (!currentUser) {
        alert("You must be logged in to rate materials.");
        return;
      }

      const loggedInUser = currentUser.trim();

      // --- ANTI-CHEAT LOGIC ---
      const targetMaterial = materials.find(m => m._id === materialId);
      
      // If the document's author matches the logged-in user, block the rating!
      if (targetMaterial && targetMaterial.student_name?.trim().toLowerCase() === loggedInUser.toLowerCase()) {
          alert("Nice try! 😉 You cannot rate your own study materials.");
          return;
      }
      // ----------------------------

      // 2. Send the rating to the backend using their Username as the ID
      await axios.post(`https://campus-share-api-cfal.onrender.com/api/materials/${materialId}/rate`, {
        user_id: loggedInUser, // <--- FIXED: Now sending their actual username!
        score: score
      });

      alert(`Thank you! Rated ${score} stars.`);
      fetchMaterials(); // Refresh to update the UI
    } catch (error) {
      console.error("Error rating material:", error);
      alert(error.response?.data?.error || "Failed to rate material.");
    }
  };

  const handleReport = async (materialId) => {
    if (window.confirm("Are you sure you want to report this document for inappropriate content?")) {
      try {
        await axios.post(`https://campus-share-api-cfal.onrender.com/api/materials/${materialId}/report`);
        alert("Document reported. Thank you for keeping the community safe.");
        fetchMaterials(); // Refresh the list (it will vanish if it hits 3 reports!)
      } catch (error) {
        console.error("Error reporting material:", error);
        alert("Failed to report material");
      }
    }
  };

  // ==========================================

  useEffect(() => {
    fetchMaterials();
  }, [filterCourse, filterYear, filterSemester]); 

  const filterSelectStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '15px', minWidth: '150px' };

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ marginRight: '20px', color: '#333' }}>🔍 Filter By:</strong>
        
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Courses</option>
          <option value="BCA">BCA</option>
          <option value="B.Tech">B.Tech</option>
          <option value="BBA">BBA</option>
        </select>

        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>

        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} style={filterSelectStyle}>
          <option value="All">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
        </select>
        
        <button 
          onClick={() => { setFilterCourse('All'); setFilterYear('All'); setFilterSemester('All'); }}
          style={{ padding: '10px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Reset Filters
        </button>
      </div>

      <h2 style={{ color: '#333' }}>Study Materials Feed</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {materials.length === 0 ? <p style={{ color: '#666', fontSize: '18px' }}>No materials found.</p> : null}
        
        {materials.map((material) => (
          <div key={material._id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '280px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#ff9800', color: 'white', padding: '5px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              Sem {material.semester}
            </span>
            <h3 style={{ color: '#1976d2', margin: '0 0 5px 0' }}>{material.title}</h3>
            
            <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>By: <strong>{material.student_name}</strong></p>
            
            <p style={{ margin: '5px 0' }}><strong>Course:</strong> {material.course}</p>
            <p style={{ margin: '5px 0' }}><strong>Year:</strong> {material.year}</p>
            <p style={{ margin: '5px 0' }}><strong>Subject:</strong> {material.subject}</p>
            
            <a href={material.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', color: '#1976d2', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Download / View
            </a>

            {material.student_name?.trim().toLowerCase() === currentUser?.trim().toLowerCase() && (
              <button 
                onClick={() => handleDelete(material._id)}
                style={{ width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#fff1f1', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Delete My Upload
              </button>
            )}

            {/* ========================================== */}
            {/* --- NEW: RATING & REPORTING UI --- */}
            {/* ========================================== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              
              {/* Star Rating System */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '14px', marginRight: '5px', color: '#666', fontWeight: 'bold' }}>
                  {material.average_rating ? material.average_rating.toFixed(1) : "0.0"} 
                </span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star} 
                    onClick={() => handleRate(material._id, star)}
                    style={{ cursor: 'pointer', color: '#ffc107', fontSize: '20px' }}
                    title={`Rate ${star} stars`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Report Button */}
              <button 
                onClick={() => handleReport(material._id)}
                style={{ backgroundColor: 'transparent', color: '#d32f2f', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                title="Report as inappropriate"
              >
                🚩 Report
              </button>
            </div>
            {/* ========================================== */}

          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;