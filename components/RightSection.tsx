"use client";

interface RightSectionProps {
  weeks: string[];
  selectedWeek: string;
  onSelectWeek: (week: string) => void;
}

export default function RightSection({ weeks, selectedWeek, onSelectWeek }: RightSectionProps) {
  return (
    <div style={{ width: '350px', padding: '20px 0 0 30px', position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ backgroundColor: '#f7f9f9', borderRadius: '16px', padding: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>주간 아카이브</h3>
        
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li 
            onClick={() => onSelectWeek('all')}
            style={{ 
              padding: '12px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px',
              backgroundColor: selectedWeek === 'all' ? '#eff3f4' : 'transparent',
              fontWeight: selectedWeek === 'all' ? 'bold' : 'normal'
            }}
          >
            전체 보기
          </li>
          {weeks.map((week) => (
            <li 
              key={week}
              onClick={() => onSelectWeek(week)}
              style={{ 
                padding: '12px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px',
                backgroundColor: selectedWeek === week ? '#eff3f4' : 'transparent',
                fontWeight: selectedWeek === week ? 'bold' : 'normal',
                color: selectedWeek === week ? '#000' : '#536471'
              }}
            >
              {week}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}