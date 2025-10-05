import React, { useState } from "react";
import "../CSS/Frame.css";

const Frame = (props) => {
  // Safely access props with fallbacks
  const title = props?.title || "Untitled Note";
  const intro = props?.intro || "";
  const why = props?.why || { title: "", points: [] };
  const examples = props?.examples || [];
  const best = props?.best || { title: "", points: [], conclusion: "" };

  const [copiedIndex, setCopiedIndex] = useState(null);

  // Enhanced copy function with visual feedback
  const copyCode = async (code, index) => {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div className="entire">
      {/* Header Section */}
      <header className="header-section">
        <h1 className="head">{title}</h1>
        {intro && (
          <div className="intro-container">
            <p className="intro">{intro}</p>
          </div>
        )}
      </header>

      {/* Why Learn Section */}
      {why.title && (
        <section className="why-section">
          <h2 className="why">{why.title}</h2>
          {why.points && why.points.length > 0 && (
            <ul className="why-list">
              {why.points.map((w, i) => (
                <li key={i} className="why-item">
                  {w}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      
      {/* Examples Section */}
      {examples && examples.length > 0 && (
        <section className="examples-section">
          <h2 className="section-title">💻 Code Examples</h2>
          <div className="examples-grid">
            {examples.map((example, idx) => (
              <div key={idx} className="example">
                <h3 className="heading">
                  <span className="example-icon">📝</span>
                  {example?.title || `Example ${idx + 1}`}
                </h3>
                {example?.code && (
                  <div className="code-container">
                    <div className="code">
                      <pre className="code-bg">
                        <code>{example.code}</code>
                      </pre>
                      <button 
                        className={`copy-btn ${copiedIndex === idx ? 'copied' : ''}`}
                        onClick={() => copyCode(example.code, idx)}
                      >
                        {copiedIndex === idx ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Best Practices Section */}
      {best.title && (
        <section className="best-practices-section">
          <h2 className="tips">{best.title}</h2>
          {best.points && best.points.length > 0 && (
            <ul className="tip-list">
              {best.points.map((tip, i) => (
                <li key={i} className="tip-item">
                  {tip}
                </li>
              ))}
            </ul>
          )}
          {best.conclusion && (
            <div className="conclusion-container">
              <p className="conclusion">{best.conclusion}</p>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="frame-footer">
        <div className="footer-content">
          <p> Enhanced Learning Experience</p>
        </div>
      </footer>
    </div>
  );
};

export default Frame;