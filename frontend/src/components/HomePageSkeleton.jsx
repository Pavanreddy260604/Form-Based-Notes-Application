import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NavBar from "./NavBar";

export function HomePageSkeleton() {
  const topicCards = Array(4).fill(0);
  const projectCards = Array(2).fill(0);

  // Theme colors for skeletons
  const baseColor = "#d1e2f0";       // darker gray-blue
  const highlightColor = "#e6f0fa";  // lighter shimmer

  return (
    <div style={{ fontFamily: "'Roboto', sans-serif" }}>
      {/* NavBar */}
      <NavBar />

      {/* Hero Section */}
      <section
        className="homepage-hero"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "100px 20px 60px 20px",
          color: "#1b2a47",
          maxWidth: "1200px",
          margin: "40px auto",
          borderRadius: "20px",
        }}
      >
        <Skeleton height={50} width={400} style={{ marginBottom: "20px" }} baseColor={baseColor} highlightColor={highlightColor} />
        <Skeleton height={25} width={350} style={{ marginBottom: "30px" }} baseColor={baseColor} highlightColor={highlightColor} />
        <Skeleton height={40} width={150} baseColor={baseColor} highlightColor={highlightColor} />
      </section>

      {/* Topics Section */}
      <section id="topics" className="homepage-section" style={{ padding: "60px 20px", textAlign: "center" }}>
        <Skeleton height={30} width={200} style={{ marginBottom: "40px" }} baseColor={baseColor} highlightColor={highlightColor} />
        <div
          className="homepage-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {topicCards.map((_, idx) => (
            <div
              key={idx}
              className="homepage-card"
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Skeleton height={20} width={120} style={{ marginBottom: 10 }} baseColor={baseColor} highlightColor={highlightColor} />
              <Skeleton count={3} height={15} baseColor={baseColor} highlightColor={highlightColor} />
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section
        className="homepage-section"
        style={{
          padding: "60px 20px",
          textAlign: "center",
          backgroundColor: "#f0f4f8",
        }}
      >
        <Skeleton height={30} width={200} style={{ marginBottom: "40px" }} baseColor={baseColor} highlightColor={highlightColor} />
        <div
          className="homepage-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {projectCards.map((_, idx) => (
            <div
              key={idx}
              className="homepage-card"
              style={{
                padding: "20px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <Skeleton height={20} width={120} style={{ marginBottom: 10 }} baseColor={baseColor} highlightColor={highlightColor} />
              <Skeleton count={3} height={15} baseColor={baseColor} highlightColor={highlightColor} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
