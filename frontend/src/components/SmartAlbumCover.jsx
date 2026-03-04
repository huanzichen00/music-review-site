import { useEffect, useMemo, useState } from 'react';
import { getAlbumCoverCandidates } from '../utils/cover';

const SmartAlbumCover = ({
  albumId,
  coverUrl,
  alt,
  variant = 'thumb',
  width,
  height,
  style,
  onClick,
  loading = 'lazy',
  ...imgProps
}) => {
  const candidates = useMemo(
    () => getAlbumCoverCandidates({ albumId, coverUrl, variant }),
    [albumId, coverUrl, variant]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  if (!candidates.length) {
    return null;
  }

  const src = candidates[Math.min(candidateIndex, candidates.length - 1)];
  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((idx) => idx + 1);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      style={style}
      onClick={onClick}
      onError={handleError}
      {...imgProps}
    />
  );
};

export default SmartAlbumCover;
