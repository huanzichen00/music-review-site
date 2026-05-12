package com.musicreview.service;

import com.musicreview.dto.album.AlbumRequest;
import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.dto.album.TrackDTO;
import com.musicreview.entity.Album;
import com.musicreview.entity.Artist;
import com.musicreview.entity.Genre;
import com.musicreview.entity.Track;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ArtistRepository;
import com.musicreview.repository.GenreRepository;
import com.musicreview.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;
    private final TrackRepository trackRepository;
    private final AuthService authService;

    /**
     * 获取全部专辑
     */
    public Page<AlbumResponse> getAllAlbums(Pageable pageable) {
        return albumRepository.findAlbumSummaries(pageable);
    }

    /**
     * 按标题首字母获取专辑（A-Z 或 #）
     */
    public Page<AlbumResponse> getAlbumsByInitial(String initial, Pageable pageable) {
        return albumRepository.findByTitleInitialOrderByTitleAsc(initial.toUpperCase(), pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * 按 ID 获取完整专辑详情
     */
    @Transactional(readOnly = true)
    public AlbumResponse getAlbumById(Long id) {
        Album album = albumRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));
        return AlbumResponse.fromEntity(album);
    }

    /**
     * 获取某位艺术家的专辑
     */
    public Page<AlbumResponse> getAlbumsByArtist(Long artistId, Pageable pageable) {
        return albumRepository.findByArtistIdOrderByReleaseYearDesc(artistId, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * 获取某个流派下的专辑
     */
    public Page<AlbumResponse> getAlbumsByGenre(Long genreId, Pageable pageable) {
        return albumRepository.findByGenreId(genreId, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * 按发行年份获取专辑
     */
    public Page<AlbumResponse> getAlbumsByYear(Integer year, Pageable pageable) {
        return albumRepository.findByReleaseYear(year, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * 获取全部可用发行年份
     */
    public List<Integer> getAllReleaseYears() {
        return albumRepository.findAllReleaseYears();
    }

    /**
     * 按标题搜索专辑
     */
    public Page<AlbumResponse> searchAlbums(String query, Pageable pageable) {
        return albumRepository.findByTitleContainingIgnoreCase(query, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * 创建专辑
     */
    @Transactional
    public AlbumResponse createAlbum(AlbumRequest request) {
        // 查询艺术家
        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + request.getArtistId()));

        // 获取当前用户
        User currentUser = authService.getCurrentUser();

        // 查询流派
        Set<Genre> genres = new HashSet<>();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            genres = request.getGenreIds().stream()
                    .map(genreId -> genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId)))
                    .collect(Collectors.toSet());
        }

        // 创建专辑实体
        Album album = Album.builder()
                .title(request.getTitle())
                .titleInitial(extractInitial(request.getTitle()))
                .artist(artist)
                .releaseYear(request.getReleaseYear())
                .coverUrl(request.getCoverUrl())
                .description(request.getDescription())
                .genres(genres)
                .createdBy(currentUser)
                .build();

        // 关联曲目（按 trackNumber + title 去重）
        List<TrackDTO> dedupedTracks = dedupeTracks(request.getTracks());
        if (!dedupedTracks.isEmpty()) {
            for (TrackDTO trackDTO : dedupedTracks) {
                Track track = Track.builder()
                        .album(album)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                album.getTracks().add(track);
            }
        }

        Album savedAlbum = albumRepository.save(album);
        return AlbumResponse.fromEntity(savedAlbum);
    }

    /**
     * 更新已有专辑
     */
    @Transactional
    public AlbumResponse updateAlbum(Long id, AlbumRequest request) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));

        // 查询艺术家
        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + request.getArtistId()));

        // 查询流派
        Set<Genre> genres = new HashSet<>();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            genres = request.getGenreIds().stream()
                    .map(genreId -> genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId)))
                    .collect(Collectors.toSet());
        }

        // 更新专辑字段
        album.setTitle(request.getTitle());
        album.setTitleInitial(extractInitial(request.getTitle()));
        album.setArtist(artist);
        album.setReleaseYear(request.getReleaseYear());
        album.setCoverUrl(request.getCoverUrl());
        album.setDescription(request.getDescription());
        album.setGenres(genres);

        // 更新曲目（按 trackNumber + title 去重）
        if (request.getTracks() != null) {
            // 先硬删除旧记录，避免 ORM 状态残留导致重复插入。
            trackRepository.deleteByAlbumId(album.getId());
            album.getTracks().clear();
            List<TrackDTO> dedupedTracks = dedupeTracks(request.getTracks());
            for (TrackDTO trackDTO : dedupedTracks) {
                Track track = Track.builder()
                        .album(album)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                album.getTracks().add(track);
            }
        }

        Album savedAlbum = albumRepository.save(album);
        return AlbumResponse.fromEntity(savedAlbum);
    }

    /**
     * 删除专辑（仅用户 "Huan" 可执行）
     */
    @Transactional
    public void deleteAlbum(Long id) {
        // 校验权限，仅用户 "Huan" 可以删除
        User currentUser = authService.getCurrentUser();
        if (!"Huan".equals(currentUser.getUsername())) {
            throw new RuntimeException("Only user 'Huan' can delete albums");
        }
        
        if (!albumRepository.existsById(id)) {
            throw new RuntimeException("Album not found with id: " + id);
        }
        albumRepository.deleteById(id);
    }

    /**
     * 提取标题首字母（A-Z，非字母则返回 #）
     */
    private String extractInitial(String title) {
        if (title == null || title.isEmpty()) {
            return "#";
        }
        char first = Character.toUpperCase(title.charAt(0));
        if (Character.isLetter(first)) {
            return String.valueOf(first);
        }
        return "#";
    }

    private List<TrackDTO> dedupeTracks(List<TrackDTO> tracks) {
        if (tracks == null || tracks.isEmpty()) {
            return List.of();
        }
        Map<String, TrackDTO> unique = new LinkedHashMap<>();
        for (TrackDTO track : tracks) {
            if (track == null || track.getTitle() == null) {
                continue;
            }
            String title = track.getTitle().trim();
            if (title.isEmpty() || track.getTrackNumber() == null) {
                continue;
            }
            String key = track.getTrackNumber() + "|" + title.toLowerCase();
            unique.putIfAbsent(key, TrackDTO.builder()
                    .trackNumber(track.getTrackNumber())
                    .title(title)
                    .duration(track.getDuration())
                    .build());
        }
        return unique.values().stream().collect(Collectors.toList());
    }
}
