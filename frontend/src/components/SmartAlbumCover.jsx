import { useEffect, useMemo, useState } from 'react';
import { getAlbumCoverCandidates } from '../utils/cover';

const SmartAlbumCover = ({
  albumId,
  coverUrl,
  alt,
  variant = 'thumb',
  sourcePreference = 'local-first',
  width,
  height,
  style,
  onClick,
  loading = 'lazy',
  fetchPriority = 'auto',
  ...imgProps
}) => {
  const candidates = useMemo(
    () => getAlbumCoverCandidates({ albumId, coverUrl, variant, sourcePreference }),
    [albumId, coverUrl, variant, sourcePreference]
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
      fetchPriority={fetchPriority}
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
