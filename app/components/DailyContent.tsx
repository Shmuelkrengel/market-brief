'use client';

interface DailyContentProps {
  concept: { term: string; definition: string } | null;
  randomFact: string | null;
}

export default function DailyContent({ concept, randomFact }: DailyContentProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Daily Financial Concept */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #111318 0%, #0d1420 100%)',
        borderColor: 'rgba(79,195,247,0.2)',
      }}>
        <div className="card-header" style={{ color: 'var(--blue)' }}>
          <span>🎓</span>
          Today&apos;s Concept
        </div>
        {concept ? (
          <>
            <div style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--blue)',
              marginBottom: 10,
              lineHeight: 1.2,
            }}>
              {concept.term}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#a0aec0', lineHeight: 1.65, margin: 0 }}>
              {concept.definition}
            </p>
          </>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Loading...</div>
        )}
      </div>

      {/* Random Interesting Fact */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #111318 0%, #140d1a 100%)',
        borderColor: 'rgba(246,201,14,0.2)',
      }}>
        <div className="card-header" style={{ color: 'var(--gold)' }}>
          <span>✨</span>
          Did You Know?
        </div>
        {randomFact ? (
          <p style={{ fontSize: '0.82rem', color: '#cbd5e0', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{randomFact}&rdquo;
          </p>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Loading...</div>
        )}
      </div>
    </div>
  );
}
