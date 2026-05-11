'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startSession } from '@/lib/api'
import { PhaseProgress, Spinner } from '@/components/ProgressAnimation'

// Unified styles for all input types to ensure consistency
const inputBaseStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s ease',
}

function TagInput({ tags, onAdd, onRemove, placeholder, variant }) {
  const [val, setVal] = useState('')

  const accentColor = variant === 'known' ? 'var(--accent3)' : 'var(--accent2)'
  const borderColor =
    variant === 'known'
      ? 'rgba(61,217,164,0.3)'
      : 'rgba(240,165,0,0.3)'

  const add = () => {
    const v = val.trim()
    if (v && !tags.includes(v)) onAdd(v)
    setVal('')
  }

  return (
    <div
      style={{
        ...inputBaseStyle,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        minHeight: 48,
        cursor: 'text',
      }}
      onClick={() => document.getElementById(`input-${placeholder}`).focus()}
    >
      {tags.map((t) => (
        <span
          key={t}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--surface)',
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 13,
            color: accentColor,
          }}
        >
          {t}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(t);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              opacity: 0.6,
              padding: 0,
            }}
          >
            ×
          </button>
        </span>
      ))}

      <input
        id={`input-${placeholder}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontSize: 14,
          flex: 1,
          minWidth: 120,
        }}
      />
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [userId, setUserId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [known, setKnown] = useState([])

  async function handleStart() {
    setError('')

    if (!userId || !projectName || !projectDesc || !startDate || !endDate || !repoUrl) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    try {
      const res = await startSession({
        user_id: userId,
        project: {
          name: projectName,
          description: projectDesc,
        },
        known_stack: known,
        start_date: startDate,
        end_date: endDate,
        repo_url: repoUrl,
        github_branch: branch || 'main',
      })

      sessionStorage.setItem('sessionId', res.session_id)
      sessionStorage.setItem('totalConcepts', res.total_concepts)

      router.push('/project')
    } catch (e) {
      setError(e.message || 'Something went wrong')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
      <PhaseProgress activeIndex={0} />

      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Configure your project</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Enter your details to initialize the session.</p>
        </header>

        <input
          placeholder="Student ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={inputBaseStyle}
        />

        <input
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={inputBaseStyle}
        />

        <textarea
          placeholder="Project Description"
          value={projectDesc}
          onChange={(e) => setProjectDesc(e.target.value)}
          style={{ ...inputBaseStyle, minHeight: 100, resize: 'vertical' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent3)' }}>KNOWN TECH STACK</label>
          <TagInput
            tags={known}
            onAdd={(v) => setKnown([...known, v])}
            onRemove={(v) => setKnown(known.filter((t) => t !== v))}
            placeholder="e.g. React, Python"
            variant="known"
          />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
             <label style={{ display: 'block', fontSize: 12, marginBottom: 6, opacity: 0.7 }}>Start Date</label>
             <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputBaseStyle}
              />
          </div>
          <div style={{ flex: 1 }}>
             <label style={{ display: 'block', fontSize: 12, marginBottom: 6, opacity: 0.7 }}>End Date</label>
             <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputBaseStyle}
              />
          </div>
        </div>

        <input
          placeholder="Repository URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={inputBaseStyle}
        />

        <button 
          onClick={handleStart} 
          disabled={loading}
          style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '14px',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 10,
            transition: 'opacity 0.2s'
          }}
        >
          {loading ? <Spinner size={18} /> : 'Start Session'}
        </button>

        {error && (
          <p style={{ 
            color: '#ff4d4d', 
            fontSize: 14, 
            textAlign: 'center', 
            background: 'rgba(255,77,77,0.1)', 
            padding: '10px', 
            borderRadius: 6 
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}