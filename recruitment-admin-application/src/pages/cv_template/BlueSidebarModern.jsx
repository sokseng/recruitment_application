// src/components/cv-templates/BlueSidebarModern.jsx
export default function BlueSidebarModern({ candidate }) {
    const profile = candidate?.profile || {};

    // Helper to safely render HTML content
    const renderHTML = (html) => html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null;

    // Helper to render skill bars
    const renderSkillBar = (skillName, level = 4, max = 5) => (
        <div key={skillName} style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.95rem', marginBottom: '4px', fontWeight: 500 }}>
                {renderHTML(skillName)}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: '20px',
                            height: '6px',
                            backgroundColor: i < level ? '#2563eb' : '#e5e7eb',
                            borderRadius: '2px',
                        }}
                    />
                ))}
            </div>
        </div>
    );

    // Helper for language levels with dots
    const renderLanguageLevel = (lang, level) => {
        const stars = level === 'Native' ? 5 : level === 'Fluent' ? 4 : 3;

        return (
            <div
                key={lang}
                style={{
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span>{renderHTML(lang.replace(/(Native|Fluent)/, '').trim())}</span>

                <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: i < stars ? '#2563eb' : '#e5e7eb',
                                boxShadow: i < stars ? '0 2px 6px rgba(37,99,235,0.4)' : 'none',
                                transition: 'background-color 0.3s',
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            id={`cv-${candidate?.pk_id || 'preview'}`}
            style={{
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                maxWidth: '210mm',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                fontSize: '10.5pt',
                lineHeight: 1.5,
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '100vh' }}>
                {/* Left Sidebar */}
                <div
                    style={{
                        backgroundColor: '#1e40af',
                        color: 'white',
                        padding: '40px 30px',
                        textAlign: 'center',
                        minHeight: '296.8mm', // full A4 height
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                    }}
                >
                    {/* Static Avatar */}
                    <div style={{ marginBottom: '20px' }}>
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            alt={`${candidate.user_name}'s avatar`}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid white',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                                backgroundColor: '#fff',
                            }}
                        />
                    </div>

                    {/* Name & Title */}
                    <h1 style={{ fontSize: '1.9rem', margin: '0 0 8px', fontWeight: 700 }}>
                        {candidate.user_name}
                    </h1>
                    <div style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '24px' }}>
                        {profile.title || 'Web Developer'}
                    </div>

                    {/* Contact */}
                    <div style={{ marginBottom: '40px', fontSize: '0.95rem', textAlign: 'left' }}>
                        {candidate.email && <div style={{ marginBottom: '8px' }}>✉️ {candidate.email}</div>}
                        {candidate.phone && <div style={{ marginBottom: '8px' }}>📱 {candidate.phone}</div>}
                        {candidate.address && <div style={{ marginBottom: '8px' }}>📍 {candidate.address}</div>}
                        {profile.linkedin && (
                            <div>
                                🔗{' '}
                                <a href={profile.linkedin} style={{ color: 'white', textDecoration: 'none' }}>
                                    LinkedIn
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {profile.skills && (
                        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
                            <h2
                                style={{
                                    fontSize: '1.1rem',
                                    marginBottom: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                SKILLS
                            </h2>
                            {profile.skills.split(',').map((skill) => renderSkillBar(skill.trim(), 4, 5))}
                        </div>
                    )}

                    {/* Languages */}
                    {profile.languages && (
                        <div style={{ textAlign: 'left' }}>
                            <h2
                                style={{
                                    fontSize: '1.1rem',
                                    marginBottom: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                LANGUAGES
                            </h2>
                            {profile.languages
                                .split(',')
                                .map((lang) =>
                                    renderLanguageLevel(
                                        lang.trim(),
                                        lang.includes('Native') ? 'Native' : 'Fluent'
                                    )
                                )}
                        </div>
                    )}
                </div>

                {/* Right Content Area */}
                <div style={{ padding: '50px 45px' }}>
                    {/* Summary */}
                    {(profile.career_objective || profile.about_me) && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2
                                style={{
                                    color: '#1e40af',
                                    fontSize: '1.25rem',
                                    marginBottom: '12px',
                                    borderBottom: '2px solid #bfdbfe',
                                    paddingBottom: '6px',
                                }}
                            >
                                SUMMARY
                            </h2>
                            {renderHTML(profile.career_objective || profile.about_me)}
                        </section>
                    )}

                    {/* Work Experience */}
                    {profile.experience && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2
                                style={{
                                    color: '#1e40af',
                                    fontSize: '1.25rem',
                                    marginBottom: '16px',
                                    borderBottom: '2px solid #bfdbfe',
                                    paddingBottom: '6px',
                                }}
                            >
                                WORK EXPERIENCE
                            </h2>
                            {renderHTML(profile.experience)}
                        </section>
                    )}

                    {/* Education */}
                    {profile.education && (
                        <section style={{ marginBottom: '40px' }}>
                            <h2
                                style={{
                                    color: '#1e40af',
                                    fontSize: '1.25rem',
                                    marginBottom: '16px',
                                    borderBottom: '2px solid #bfdbfe',
                                    paddingBottom: '6px',
                                }}
                            >
                                EDUCATION
                            </h2>
                            {renderHTML(profile.education)}
                        </section>
                    )}

                    {/* References */}
                    {profile.reference_text && (
                        <section>
                            <h2
                                style={{
                                    color: '#1e40af',
                                    fontSize: '1.25rem',
                                    marginBottom: '12px',
                                    borderBottom: '2px solid #bfdbfe',
                                    paddingBottom: '6px',
                                }}
                            >
                                REFERENCES
                            </h2>
                            {renderHTML(profile.reference_text)}
                        </section>
                    )}
                </div>
            </div>

            {/* Print optimizations */}
            <style>{`
                @media print {
                body { background: white !important; }
                div[style*="gridTemplateColumns"] { display: block !important; }
                > div:first-child { background: #1e40af !important; color: white !important; page-break-inside: avoid; }
                a { color: white !important; text-decoration: underline; }
                }
            `}</style>
        </div>
    );
}
