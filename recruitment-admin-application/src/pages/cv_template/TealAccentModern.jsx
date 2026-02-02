// src/components/cv-templates/TealAccentModern.jsx
export default function TealAccentModern({ candidate }) {
  const profile = candidate?.profile || {};

  const renderHTML = (html) => html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null;

  return (
    <div
      id={`cv-${candidate?.pk_id || 'teal'}`}
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        maxWidth: '210mm',
        margin: '0 auto',
        background: '#ffffff',
        color: '#0f172a',
        fontSize: '11pt',
        lineHeight: 1.6,
        boxShadow: '0 0 15px rgba(0,0,0,0.05)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
          color: 'white',
          padding: '70px 50px 50px',
          textAlign: 'center',
          position: 'relative',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        }}
      >
        <h1 style={{ fontSize: '2.6rem', margin: '0 0 8px', fontWeight: 800 }}>
          {candidate.user_name}
        </h1>
        <p style={{ fontSize: '1.3rem', opacity: 0.9, fontWeight: 500 }}>
          {profile.title || 'Senior Cloud Solutions Architect'}
        </p>
        <div style={{ marginTop: '25px', fontSize: '1rem', fontWeight: 400, opacity: 0.95 }}>
          {candidate.email}  •  {candidate.phone}  •  {candidate.address}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 32%) 1fr', gap: '50px', padding: '50px' }}>
        {/* Sidebar */}
        <aside style={{
          background: '#ccfbf1',
          padding: '40px 30px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        }}>
          {/* Avatar */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <img
              src={profile.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt={`${candidate.user_name}'s avatar`}
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                backgroundColor: '#fff',
              }}
            />
          </div>

          {/* Skills */}
          <h2 style={{ color: '#0f766e', fontSize: '1.25rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Skills
          </h2>
          {renderHTML(profile.skills || 'Cloud Computing, Kubernetes, Strategic Planning, Team Leadership')}

          {/* Languages */}
          <h2 style={{ color: '#0f766e', fontSize: '1.25rem', margin: '35px 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Languages
          </h2>
          {renderHTML(profile.languages || 'English: Native, German: Fluent')}
        </aside>

        {/* Main content */}
        <main>
          {['Summary', 'Work Experience', 'Education', 'References'].map((section) => (
            <section key={section} style={{ marginBottom: '50px' }}>
              <h2 style={{
                color: '#0f766e',
                fontSize: '1.4rem',
                marginBottom: '16px',
                position: 'relative',
                paddingBottom: '6px',
              }}>
                {section}
                <span style={{
                  content: '""',
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  width: '50px',
                  height: '4px',
                  background: '#14b8a6',
                  borderRadius: '2px'
                }} />
              </h2>
              {section === 'Summary' && renderHTML(profile.career_objective || profile.about_me || 'Dynamic professional with proven expertise...')}
              {section === 'Work Experience' && renderHTML(profile.experience || 'Chief Technology Officer • XYZ Tech • 2018–Present<br>• Led strategy development...<br>• Reduced breaches by 40%...')}
              {section === 'Education' && renderHTML(profile.education || 'Master of Science in Computer Science • MIT • 2003–2005')}
              {section === 'References' && (renderHTML(profile.reference_text) || <p>Available upon request</p>)}
            </section>
          ))}
        </main>
      </div>

      <style>{`
        @media print {
          header { background: #0d9488 !important; color: white !important; }
          aside { background: #ccfbf1 !important; min-height: auto !important; }
        }

        @media screen and (max-width: 900px) {
          div#cv-teal {
            display: block;
            padding: 20px !important;
          }
          main, aside {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}
