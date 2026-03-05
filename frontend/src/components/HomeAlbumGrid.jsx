import AlbumCard from './AlbumCard';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
  gap: 18,
};

const emptyStyle = {
  borderRadius: 10,
  border: '1px solid #E8D5C4',
  background: '#FFFBF7',
  padding: 16,
  color: '#8D6E63',
};

const HomeAlbumGrid = ({ albums }) => {
  if (!Array.isArray(albums) || albums.length === 0) {
    return <div style={emptyStyle}>暂无推荐专辑。</div>;
  }

  return (
    <section style={gridStyle}>
      {albums.map((album, index) => (
        <div key={album.id}>
          <AlbumCard album={album} priority={index < 2 ? 'high' : 'auto'} />
        </div>
      ))}
    </section>
  );
};

export default HomeAlbumGrid;
