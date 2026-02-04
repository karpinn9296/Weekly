"use client";

interface RightSectionProps {
  weeks: string[];
  weekLabels?: Record<string, string>; // ★ 추가: 한글 이름 정보 받기
  selectedWeek: string;
  onSelectWeek: (week: string) => void;
}

export default function RightSection({ weeks, weekLabels = {}, selectedWeek, onSelectWeek }: RightSectionProps) {
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
              {/* ★ 변경: ID 대신 전달받은 한글 이름 표시 */}
              {weekLabels[week] || week}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}