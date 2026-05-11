'use client'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function TaskCard({ task }) {
  const dayName = DAYS[(task.day ?? 1) - 1] || `Day ${task.day}`

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* ── header bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          minWidth: 72,
        }}>
          {dayName}
        </span>
        <span style={{
          fontFamily: 'var(--font-head)',
          fontSize: 15,
          fontWeight: 700,
          flex: 1,
          lineHeight: 1.3,
        }}>
          {task.title}
        </span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '2px 10px',
          whiteSpace: 'nowrap',
        }}>
          {task.estimated_hours}h
        </span>
      </div>

      {/* ── body ── */}
      <div style={{ padding: '16px 20px' }}>
        {/* description */}
        <p style={{
          fontSize: 13,
          color: 'var(--text)',
          lineHeight: 1.65,
          marginBottom: 16,
        }}>
          {task.description}
        </p>

        {/* steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {(task.steps || []).map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* submission chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: 'var(--accent2)',
          background: 'rgba(240,165,0,0.07)',
          border: '1px solid rgba(240,165,0,0.2)',
          borderRadius: 6,
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>📁</span>
          <span>{task.submission?.github_folder}/{task.submission?.filename}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
            {task.submission?.commit_message}
          </span>
        </div>
      </div>
    </div>
  )
}
