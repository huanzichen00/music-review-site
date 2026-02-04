import { Button } from 'antd';

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const AlphabetFilter = ({ selected, onChange }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '4px',
      marginBottom: '24px',
      justifyContent: 'center'
    }}>
      <Button
        type={selected === null ? 'primary' : 'default'}
        size="small"
        onClick={() => onChange(null)}
      >
        全部
      </Button>
      {LETTERS.map((letter) => (
        <Button
          key={letter}
          type={selected === letter ? 'primary' : 'default'}
          size="small"
          onClick={() => onChange(letter)}
          style={{ minWidth: '32px' }}
        >
          {letter}
        </Button>
      ))}
    </div>
  );
};

export default AlphabetFilter;
