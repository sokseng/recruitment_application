// src/components/cv-templates/ClassicSoftwareCV.jsx

export const ClassicSoftwareCV = ({ candidate }) => {
  const profile = candidate?.profile || {};

  const renderHTML = (html) =>
    html ? <div style={{ all: 'unset' }} dangerouslySetInnerHTML={{ __html: html }} /> : null;

  return (
    <div
      id={`cv-${candidate?.pk_id || 'classic-software'}`}
      style={{
        fontFamily: "'Inter', 'Segoe UI', Tahoma, sans-serif",
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '50px 60px',
        background: '#ffffff',
        color: '#1a1a1a',
        lineHeight: '1.5',
        minHeight: '296.8mm',
        boxSizing: 'border-box'
      }}
    >
      {/* ================= HEADER ================= */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 10px', color: '#000' }}>
          {candidate.user_name?.toUpperCase()}
        </h1>
        <div style={{ fontSize: '1rem', color: '#444', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span>📍 {candidate.address}</span>
          <span>|</span>
          <span>📞 {candidate.phone}</span>
          <span>|</span>
          <span style={{ fontWeight: 600 }}>✉️ {candidate.email}</span>
        </div>
      </header>

      {/* ================= SUMMARY ================= */}
      <section style={{ marginBottom: '25px' }}>
        <h2 style={classicSectionTitle}>Professional Summary</h2>
        <div style={classicBodyText}>
          {renderHTML(profile.about_me)}
        </div>
      </section>

      {/* ================= CORE SKILLS (The 'Technical Grid') ================= */}
      <section style={{ marginBottom: '25px' }}>
        <h2 style={classicSectionTitle}>Technical Skills</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '10px',
          fontSize: '0.9rem',
          color: '#333'
        }}>
          {/* We parse the skills into a clean bulleted grid */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <strong>Stack:</strong> 
            <span>{profile.skills?.replace(/<\/?[^>]+(>|$)/g, "")}</span>
          </div>
        </div>
      </section>

      {/* ================= EXPERIENCE ================= */}
      <section style={{ marginBottom: '25px' }}>
        <h2 style={classicSectionTitle}>Professional Experience</h2>
        <div className="experience-container" style={classicBodyText}>
          {renderHTML(profile.experience)}
        </div>
      </section>

      {/* ================= EDUCATION ================= */}
      <section style={{ marginBottom: '25px' }}>
        <h2 style={classicSectionTitle}>Education</h2>
        <div style={classicBodyText}>
          {renderHTML(profile.education)}
        </div>
      </section>

      {/* ================= OBJECTIVE & LANGUAGES ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <section>
          <h2 style={classicSectionTitle}>Career Objective</h2>
          <div style={{ ...classicBodyText, fontSize: '0.85rem' }}>
            {renderHTML(profile.career_objective)}
          </div>
        </section>
        <section>
          <h2 style={classicSectionTitle}>Languages</h2>
          <div style={{ ...classicBodyText, fontSize: '0.85rem' }}>
            {renderHTML(profile.languages)}
          </div>
        </section>
      </div>

      <style>{`
        .experience-container strong { 
          display: block; 
          font-size: 1.1rem; 
          margin-top: 15px; 
          color: #000;
        }
        .experience-container ul { 
          margin-top: 5px; 
          padding-left: 20px; 
        }
        .experience-container li { 
          margin-bottom: 5px; 
        }
        @media print {
          body { margin: 0; }
          #cv-classic-software { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
};

// --- Styles ---

const classicSectionTitle = {
  fontSize: '1rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  borderBottom: '2px solid #1a1a1a',
  paddingBottom: '3px',
  marginBottom: '12px',
  color: '#000',
  letterSpacing: '0.05em'
};

const classicBodyText = {
  fontSize: '0.95rem',
  color: '#333',
  textAlign: 'justify'
};

export default ClassicSoftwareCV;