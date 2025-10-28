import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Main Topics Component
const Topics = ({ user }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    path: "",
    intro: "",
    why: { title: "", points: [""] },
    examples: [{ title: "", code: "" }],
    best: { title: "", points: [""], conclusion: "" }
  });
  const navigate = useNavigate();

  // Fetch items (topics) for the logged-in user
  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      setTopics([]);
      setError("Please log in to view your notes");
      return;
    }

    fetchTopics();
  }, [user]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/items/user/${user.userId}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      console.log("API Response:", result);
      
      // Handle both response formats: {success, data} or direct array
      if (result && result.success !== undefined) {
        if (result.success && Array.isArray(result.data)) {
          setTopics(result.data);
        } else {
          throw new Error(result.message || "Failed to load notes");
        }
      } else if (Array.isArray(result)) {
        // Direct array response (fallback)
        setTopics(result);
      } else {
        throw new Error("Invalid response format from server");
      }
      
    } catch (err) {
      console.error("Error fetching topics:", err);
      setError(`Failed to load notes: ${err.message}`);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (topicId, topicTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${topicTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(topicId);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/items/${topicId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to delete note");
      }

      setTopics(topics.filter(topic => topic._id !== topicId));
      
    } catch (err) {
      console.error("Error deleting note:", err);
      alert(`Failed to delete note: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic._id);
    setEditFormData({
      title: topic.title || "",
      path: topic.path || "",
      intro: topic.intro || "",
      why: {
        title: topic.why?.title || "",
        points: topic.why?.points?.length > 0 ? [...topic.why.points] : [""]
      },
      examples: topic.examples?.length > 0 ? [...topic.examples] : [{ title: "", code: "" }],
      best: {
        title: topic.best?.title || "",
        points: topic.best?.points?.length > 0 ? [...topic.best.points] : [""],
        conclusion: topic.best?.conclusion || ""
      }
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedEditChange = (section, field, index, value) => {
    setEditFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      
      if (section === "why" && field === "points") {
        copy.why.points[index] = value;
      } else if (section === "examples") {
        copy.examples[index][field] = value;
      } else if (section === "best" && field === "points") {
        copy.best.points[index] = value;
      } else if (section === "best" && field === "conclusion") {
        copy.best.conclusion = value;
      } else if (section === "why" && field === "title") {
        copy.why.title = value;
      } else if (section === "best" && field === "title") {
        copy.best.title = value;
      }
      
      return copy;
    });
  };

  const addPoint = (section, field) => {
    setEditFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      
      if (section === "why" && field === "points") {
        copy.why.points.push("");
      } else if (section === "best" && field === "points") {
        copy.best.points.push("");
      } else if (section === "examples") {
        copy.examples.push({ title: "", code: "" });
      }
      
      return copy;
    });
  };

  const removePoint = (section, field, index) => {
    setEditFormData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      
      if (section === "why" && field === "points") {
        if (copy.why.points.length > 1) {
          copy.why.points.splice(index, 1);
        }
      } else if (section === "best" && field === "points") {
        if (copy.best.points.length > 1) {
          copy.best.points.splice(index, 1);
        }
      } else if (section === "examples") {
        if (copy.examples.length > 1) {
          copy.examples.splice(index, 1);
        }
      }
      
      return copy;
    });
  };

  const handleEditSubmit = async (topicId) => {
    if (!editFormData.title.trim() || !editFormData.path.trim()) {
      alert("Title and path are required");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/items/${topicId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to update note");
      }

      const updatedTopic = result.data;
      
      // Update local state
      setTopics(topics.map(topic => 
        topic._id === topicId ? { ...topic, ...updatedTopic } : topic
      ));
      
      setEditingTopic(null);
      setEditFormData({ 
        title: "", 
        path: "", 
        intro: "", 
        why: { title: "", points: [""] }, 
        examples: [{ title: "", code: "" }], 
        best: { title: "", points: [""], conclusion: "" } 
      });
      
      alert("Note updated successfully!");
    } catch (err) {
      console.error("Error updating note:", err);
      alert(`Failed to update note: ${err.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingTopic(null);
    setEditFormData({ 
      title: "", 
      path: "", 
      intro: "", 
      why: { title: "", points: [""] }, 
      examples: [{ title: "", code: "" }], 
      best: { title: "", points: [""], conclusion: "" } 
    });
  };

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading your notes...</p>
    </div>
  );

  if (error) return (
    <div style={styles.errorContainer}>
      <p style={styles.errorText}>{error}</p>
      <button onClick={fetchTopics} style={styles.retryButton}>
        🔄 Retry
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Notes</h1>
        <p style={styles.subtitle}>Manage and organize your learning materials</p>
      </div>

      {topics.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📚</div>
          <h3 style={styles.emptyTitle}>No notes yet</h3>
          <p style={styles.emptyText}>Start creating your first note to build your knowledge base.</p>
          <button
            onClick={() => navigate("/add-topic")}
            style={styles.addButton}
          >
            <span style={styles.addIcon}>+</span>
            Create Your First Note
          </button>
        </div>
      ) : (
        <div style={styles.topicsGrid}>
          {topics.map((topic) => (
            <div key={topic._id} style={styles.topicCard}>
              {editingTopic === topic._id ? (
                // Edit Mode - Full Form
                <div style={styles.editForm}>
                  <h3 style={styles.editTitle}>Edit Note: {topic.title}</h3>
                  
                  {/* Basic Information */}
                  <div style={styles.formSection}>
                    <h4 style={styles.sectionTitle}>Basic Information</h4>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleEditChange}
                        style={styles.input}
                        placeholder="Enter note title"
                        required
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Path *</label>
                      <input
                        type="text"
                        name="path"
                        value={editFormData.path}
                        onChange={handleEditChange}
                        style={styles.input}
                        placeholder="/note-path"
                        required
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Introduction</label>
                      <textarea
                        name="intro"
                        value={editFormData.intro}
                        onChange={handleEditChange}
                        style={styles.textarea}
                        placeholder="Brief description..."
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Why Section */}
                  <div style={styles.formSection}>
                    <h4 style={styles.sectionTitle}>Why Learn This</h4>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Section Title</label>
                      <input
                        type="text"
                        value={editFormData.why.title}
                        onChange={(e) => handleNestedEditChange("why", "title", null, e.target.value)}
                        style={styles.input}
                        placeholder="Why learn about this note?"
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Key Points</label>
                      {editFormData.why.points.map((point, index) => (
                        <div key={index} style={styles.pointItem}>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => handleNestedEditChange("why", "points", index, e.target.value)}
                            style={styles.input}
                            placeholder={`Point ${index + 1}`}
                          />
                          <button 
                            type="button"
                            onClick={() => removePoint("why", "points", index)}
                            disabled={editFormData.why.points.length === 1}
                            style={styles.removePointButton}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => addPoint("why", "points")}
                        style={styles.addPointButton}
                      >
                        + Add Point
                      </button>
                    </div>
                  </div>

                  {/* Examples Section */}
                  <div style={styles.formSection}>
                    <h4 style={styles.sectionTitle}>Code Examples</h4>
                    {editFormData.examples.map((example, index) => (
                      <div key={index} style={styles.exampleItem}>
                        <div style={styles.exampleHeader}>
                          <h5 style={styles.exampleSubtitle}>Example {index + 1}</h5>
                          <button 
                            type="button"
                            onClick={() => removePoint("examples", null, index)}
                            disabled={editFormData.examples.length === 1}
                            style={styles.removePointButton}
                          >
                            Remove Example
                          </button>
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Example Title</label>
                          <input
                            type="text"
                            value={example.title}
                            onChange={(e) => handleNestedEditChange("examples", "title", index, e.target.value)}
                            style={styles.input}
                            placeholder="e.g., Basic Usage"
                          />
                        </div>
                        
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Code</label>
                          <textarea
                            value={example.code}
                            onChange={(e) => handleNestedEditChange("examples", "code", index, e.target.value)}
                            style={{...styles.textarea, ...styles.codeTextarea}}
                            placeholder="Paste your code here..."
                            rows="4"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => addPoint("examples", null)}
                      style={styles.addPointButton}
                    >
                      + Add Another Example
                    </button>
                  </div>

                  {/* Best Practices Section */}
                  <div style={styles.formSection}>
                    <h4 style={styles.sectionTitle}>Best Practices</h4>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Section Title</label>
                      <input
                        type="text"
                        value={editFormData.best.title}
                        onChange={(e) => handleNestedEditChange("best", "title", null, e.target.value)}
                        style={styles.input}
                        placeholder="Best Practices and Guidelines"
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Practice Points</label>
                      {editFormData.best.points.map((point, index) => (
                        <div key={index} style={styles.pointItem}>
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => handleNestedEditChange("best", "points", index, e.target.value)}
                            style={styles.input}
                            placeholder={`Practice ${index + 1}`}
                          />
                          <button 
                            type="button"
                            onClick={() => removePoint("best", "points", index)}
                            disabled={editFormData.best.points.length === 1}
                            style={styles.removePointButton}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => addPoint("best", "points")}
                        style={styles.addPointButton}
                      >
                        + Add Practice
                      </button>
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Conclusion</label>
                      <textarea
                        value={editFormData.best.conclusion}
                        onChange={(e) => handleNestedEditChange("best", "conclusion", null, e.target.value)}
                        style={styles.textarea}
                        placeholder="Summary and final thoughts..."
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Edit Actions */}
                  <div style={styles.editActions}>
                    <button 
                      onClick={() => handleEditSubmit(topic._id)}
                      style={styles.saveButton}
                    >
                      💾 Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      style={styles.cancelButton}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div style={styles.topicContent}>
                    <Link
                      to={topic.path}
                      style={styles.topicLink}
                    >
                      <h3 style={styles.topicTitle}>{topic.title}</h3>
                    </Link>
                    {topic.intro && (
                      <p style={styles.topicIntro}>{topic.intro}</p>
                    )}
                    <div style={styles.topicMeta}>
                      <span style={styles.exampleCount}>
                        {topic.examples?.length || 0} example{topic.examples?.length !== 1 ? 's' : ''}
                      </span>
                      <span style={styles.path}>{topic.path}</span>
                    </div>
                    <div style={styles.sectionPreview}>
                      <div style={styles.previewItem}>
                        <strong>Why:</strong> {topic.why?.points?.length || 0} points
                      </div>
                      <div style={styles.previewItem}>
                        <strong>Best Practices:</strong> {topic.best?.points?.length || 0} points
                      </div>
                    </div>
                    <div style={styles.dateInfo}>
                      Created: {new Date(topic.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleEdit(topic)}
                      style={styles.editButton}
                      title="Edit note"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(topic._id, topic.title)}
                      disabled={deletingId === topic._id}
                      style={deletingId === topic._id ? styles.deleteButtonDisabled : styles.deleteButton}
                      title="Delete note"
                    >
                      {deletingId === topic._id ? "⏳" : "🗑️ Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Note button */}
      {topics.length > 0 && (
        <div style={styles.footer}>
          <button
            onClick={() => navigate("/add-topic")}
            style={styles.addButton}
          >
            <span style={styles.addIcon}>+</span>
            Create New Note
          </button>
        </div>
      )}
    </div>
  );
};

// Responsive Dark Theme Styles
const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    padding: '20px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    margin: 0,
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'left',
    marginBottom: '40px',
    maxWidth: 'none',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: '800',
    color: '#f8fafc',
    margin: '0 0 12px 0',
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 3vw, 1.3rem)',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '400',
    lineHeight: '1.4',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#0f172a',
    width: '100%',
    minHeight: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #334155',
    borderTop: '3px solid #60a5fa',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: '1.1rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#0f172a',
    width: '100%',
    minHeight: '60vh',
  },
  errorText: {
    color: '#f87171',
    fontSize: '1.1rem',
    marginBottom: '20px',
    lineHeight: '1.5',
  },
  retryButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    minWidth: '120px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '16px',
    border: '1px solid #475569',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    margin: '0 auto',
    maxWidth: '500px',
    width: '100%',
  },
  emptyIcon: {
    fontSize: 'clamp(3rem, 10vw, 5rem)',
    marginBottom: '24px',
    opacity: '0.8',
  },
  emptyTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    color: '#f1f5f9',
    margin: '0 0 12px 0',
    fontWeight: '600',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 'clamp(1rem, 3vw, 1.1rem)',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
  },
  topicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
    gap: '20px',
    marginBottom: '40px',
    width: '100%',
  },
  topicCard: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid #475569',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topicContent: {
    marginBottom: '16px',
    flex: 1,
  },
  topicLink: {
    textDecoration: 'none',
    color: '#f1f5f9',
    display: 'block',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
  },
  topicTitle: {
    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
    fontWeight: '700',
    margin: '0 0 12px 0',
    lineHeight: '1.4',
    color: '#f8fafc',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  topicIntro: {
    color: '#cbd5e1',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  topicMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '12px',
    flexDirection: 'column',
    gap: '8px',
  },
  exampleCount: {
    background: 'rgba(96, 165, 250, 0.1)',
    padding: '6px 12px',
    borderRadius: '10px',
    fontWeight: '600',
    color: '#60a5fa',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  path: {
    fontFamily: 'monospace',
    background: 'rgba(30, 64, 175, 0.2)',
    padding: '6px 12px',
    borderRadius: '8px',
    color: '#bfdbfe',
    fontWeight: '500',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    fontSize: '0.8rem',
    textAlign: 'center',
  },
  sectionPreview: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  previewItem: {
    fontSize: '0.8rem',
    color: '#cbd5e1',
    background: 'rgba(51, 65, 85, 0.6)',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #475569',
    textAlign: 'center',
  },
  dateInfo: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    borderTop: '1px solid #334155',
    paddingTop: '16px',
    flexDirection: 'column',
  },
  editButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
    flex: 1,
  },
  deleteButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
    flex: 1,
  },
  deleteButtonDisabled: {
    background: '#475569',
    color: '#94a3b8',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '600',
    opacity: 0.6,
    flex: 1,
  },
  // Edit Form Styles
  editForm: {
    width: '100%',
  },
  editTitle: {
    fontSize: 'clamp(1.3rem, 4vw, 2rem)',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#f8fafc',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.3',
  },
  formSection: {
    marginBottom: '24px',
    padding: '20px',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    borderRadius: '10px',
    border: '1px solid #475569',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  sectionTitle: {
    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#f1f5f9',
    borderBottom: '2px solid #475569',
    paddingBottom: '8px',
  },
  exampleSubtitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#e2e8f0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#f1f5f9',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #475569',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    outline: 'none',
    WebkitAppearance: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #475569',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    resize: 'vertical',
    minHeight: '80px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    outline: 'none',
  },
  codeTextarea: {
    fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
    fontSize: '13px',
    background: '#0f172a',
    color: '#e2e8f0',
    borderColor: '#60a5fa',
    minHeight: '120px',
  },
  pointItem: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center',
    flexDirection: 'column',
  },
  exampleItem: {
    background: 'rgba(15, 23, 42, 0.8)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #475569',
    marginBottom: '16px',
    backdropFilter: 'blur(10px)',
  },
  exampleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexDirection: 'column',
    gap: '10px',
  },
  removePointButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  addPointButton: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    width: '100%',
  },
  editActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '2px solid #475569',
    flexDirection: 'column',
  },
  saveButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    flex: 1,
  },
  cancelButton: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    paddingTop: '40px',
    borderTop: '1px solid #334155',
  },
  addButton: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
    width: '100%',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
};

export default Topics;