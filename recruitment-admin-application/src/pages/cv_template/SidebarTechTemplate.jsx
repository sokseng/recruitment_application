// src/components/cv-templates/SidebarTechTemplate.jsx

export default function SidebarTechTemplate({ candidate }) {
  const profile = candidate?.profile || {};

  const renderHTML = (html) =>
    html ? <div style={{ all: 'unset' }} dangerouslySetInnerHTML={{ __html: html }} /> : null;

  return (
    <div
      id={`cv-${candidate?.pk_id || 'sidebar-tech-template'}`}
      style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        maxWidth: '210mm',
        margin: '0 auto',
        background: '#ffffff',
        color: '#334155',
        display: 'flex',
        minHeight: '296.8mm',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        style={{
          width: '32%', // Narrowed slightly
          background: '#0f172a',
          color: '#f8fafc',
          padding: '40px 25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          position: 'relative',
        }}
      >
        {/* Profile Circle - Scaled Down */}
        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
          <div style={{
            position: 'absolute',
            inset: '-3px',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            borderRadius: '50%',
            opacity: 0.6
          }} />
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #0f172a'
          }}>
            <img 
              src={profile.photo || 'https://avatars.githubusercontent.com/u/150273486?v=4'} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              alt="Candidate"
            />
          </div>
        </div>

        {/* Contact Info */}
        <section>
          <h3 style={sidebarTitle}>Connect</h3>
          <div style={sidebarContent}>
            <div style={contactRow}><span style={iconSpan}>📍</span> <span style={wrappedText}>{candidate.address}</span></div>
            <div style={contactRow}><span style={iconSpan}>✉️</span> <span style={wrappedText}>{candidate.email}</span></div>
            <div style={contactRow}><span style={iconSpan}>📞</span> <span style={wrappedText}>{candidate.phone}</span></div>
          </div>
        </section>

        {/* Skills - Smaller Tags */}
        <section>
          <h3 style={sidebarTitle}>Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.skills?.replace(/<\/?[^>]+(>|$)/g, "").split(',').map((skill, i) => (
              <span key={i} style={skillTag}>{skill.trim()}</span>
            ))}
          </div>
        </section>

        <section>
          <h3 style={sidebarTitle}>Languages</h3>
          <div style={{ ...sidebarContent, opacity: 0.9 }}>
            {renderHTML(profile.languages)}
          </div>
        </section>
      </aside>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <main style={{ width: '68%', padding: '45px 30px' }}>
        
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.2rem', // Reduced from 3rem
            fontWeight: 800, 
            margin: 0, 
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}>
            {candidate.user_name}
          </h1>
          <div style={{ 
            fontSize: '1rem',
            fontWeight: 600,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '4px'
          }}>
            Software Engineer
          </div>
        </header>

        {/* About Section - More compact */}
        <section style={{ marginBottom: '30px' }}>
          <div style={{ 
            fontSize: '0.92rem', 
            lineHeight: '1.6', 
            color: '#475569',
            borderLeft: '2px solid #e2e8f0',
            paddingLeft: '15px'
          }}>
            {renderHTML(profile.about_me)}
          </div>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={sectionHeader}>Experience</h2>
          <div className="experience-list" style={mainTextBody}>
            {renderHTML(profile.experience)}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px', marginBottom: '30px' }}>
          <section>
            <h2 style={sectionHeader}>Education</h2>
            <div style={{ ...mainTextBody, fontSize: '0.85rem' }}>
              {renderHTML(profile.education)}
            </div>
          </section>
          <section>
            <h2 style={sectionHeader}>Career Goal</h2>
            <div style={{ ...mainTextBody, fontSize: '0.85rem', fontStyle: 'italic' }}>
              {renderHTML(profile.career_objective)}
            </div>
          </section>
        </div>

        <section style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <h2 style={{ ...sectionHeader, border: 'none', padding: 0, fontSize: '0.9rem' }}>References</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '15px',
            fontSize: '0.8rem',
            color: '#64748b'
          }}>
            {renderHTML(profile.reference_text)}
          </div>
        </section>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .experience-list p { margin: 0; }
        .experience-list ul { padding-left: 15px; margin: 8px 0 15px 0; }
        .experience-list li { margin-bottom: 4px; font-size: 0.88rem; color: #475569; }
        .experience-list strong { 
          color: #0f172a; 
          font-size: 1rem; 
          display: block; 
          margin-top: 12px;
          font-weight: 700;
        }
        
        @media print {
          aside { background: #0f172a !important; -webkit-print-color-adjust: exact; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}

// --- Style Objects ---

const sidebarTitle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: '#38bdf8',
  fontWeight: 700,
  marginBottom: '12px',
  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
  paddingBottom: '4px'
};

const sidebarContent = {
  fontSize: '0.8rem', 
  lineHeight: '1.5',
  color: '#cbd5e1'
};

const wrappedText = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word'
};

const contactRow = {
  display: 'flex',
  gap: '10px',
  marginBottom: '8px',
  alignItems: 'flex-start'
};

const iconSpan = { fontSize: '0.9rem', flexShrink: 0 };

const skillTag = {
  background: 'rgba(255,255,255,0.05)',
  color: '#f8fafc',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  border: '1px solid rgba(255,255,255,0.1)',
};

const sectionHeader = {
  fontSize: '0.95rem',
  fontWeight: 800,
  color: '#0f172a',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '15px',
  display: 'flex',
  alignItems: 'center',
  borderLeft: '3px solid #38bdf8',
  paddingLeft: '12px'
};

const mainTextBody = {
  lineHeight: '1.6',
  color: '#475569',
  fontSize: '0.9rem'
};