// src/components/cv-templates/BlueSidebarModern.jsx
export default function BlueSidebarModern({ candidate }) {
    const profile = candidate?.profile || {};

    // Helper to safely render HTML content
    const renderHTML = (html) => html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : null;

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
                        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
                        color: 'white',
                        padding: '50px 35px',
                        textAlign: 'center',
                        minHeight: '296.8mm',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.05)',
                    }}
                >
                    {/* Avatar with Ring Effect */}
                    <div style={{ position: 'relative', marginBottom: '30px', display: 'inline-block' }}>
                        <div style={{
                            position: 'absolute',
                            top: '-5px', left: '50%', transform: 'translateX(-50%)',
                            width: '130px', height: '130px',
                            borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.2)',
                        }} />
                        <img
                            src="https://avatars.githubusercontent.com/u/145982875?v=4"
                            alt={`${candidate.user_name}'s avatar`}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid white',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                backgroundColor: '#fff',
                                position: 'relative',
                                zIndex: 1
                            }}
                        />
                    </div>

                    {/* Name & Title */}
                    <div style={{ marginBottom: '35px' }}>
                        <h1 style={{
                            fontSize: '2rem',
                            margin: '0 0 5px',
                            fontWeight: 800,
                            letterSpacing: '-0.5px',
                            lineHeight: 1.2
                        }}>
                            {candidate.user_name}
                        </h1>
                        <div style={{
                            fontSize: '1rem',
                            fontWeight: 300,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: '#bfdbfe',
                            marginTop: '10px'
                        }}>
                            {profile.title || 'Web Developer'}
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '40px',
                        textAlign: 'left',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {candidate.email && <div style={{ marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ opacity: 0.7 }}>✉️</span> {candidate.email}
                        </div>}
                        {candidate.phone && <div style={{ marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ opacity: 0.7 }}>📱</span> {candidate.phone}
                        </div>}
                        {candidate.address && <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ opacity: 0.7 }}>📍</span> {candidate.address}
                        </div>}
                    </div>

                    {/* Skills with Modern Glass Pills */}
                    {profile.skills && (
                        <div style={{ marginBottom: '45px', textAlign: 'left' }}>
                            <h2 style={{
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                marginBottom: '22px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                color: '#93c5fd',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ width: '24px', height: '2px', backgroundColor: '#60a5fa', borderRadius: '2px' }}></span>
                                Skills
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {profile.skills
                                    // 1. Remove <p>, </p>, <div>, and </div> tags globally
                                    ?.replace(/<\/?p>|<\/?div>/gi, '')
                                    .split(',')
                                    .map((skill, index) => (
                                        <span
                                            key={`${skill}-${index}`}
                                            style={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                                                color: '#ffffff',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                backdropFilter: 'blur(4px)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                lineHeight: '1',
                                                margin: 0      
                                            }}
                                        >
                                            {renderHTML(skill.trim())}
                                        </span>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {/* Languages with Minimalist Typography */}
                    {profile.languages && (
                        <div style={{ textAlign: 'left' }}>
                            <h2 style={{
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                color: '#93c5fd',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ width: '24px', height: '2px', backgroundColor: '#60a5fa', borderRadius: '2px' }}></span>
                                Languages
                            </h2>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {profile.languages?.replace(/<\/?p>|<\/?div>/gi, '').split(',').map((lang) => {
                                    const isNative = lang.includes('Native');
                                    return (
                                        <div
                                            key={lang}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '8px 0',
                                                alignItems: 'center',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.18)'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#f3f4f6' }}>
                                                {renderHTML(lang.replace(/(Native|Fluent)/, '').trim())}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                textTransform: 'uppercase',
                                                color: isNative ? '#60a5fa' : '#94a3b8',
                                                fontWeight: 700,
                                                letterSpacing: '1px'
                                            }}>
                                                {isNative ? 'Native' : 'Fluent'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
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
                            {profile.about_me && renderHTML(profile.about_me)}
                            {profile.career_objective && renderHTML(profile.career_objective)}
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
        </div>
    );
}
