package com.musicreview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tracks")
public class Track {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    @Column(name = "track_number", nullable = false)
    private Integer trackNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column
    private Integer duration; // 时长，单位为秒

    /**
     * 获取 MM:SS 格式的时长字符串
     */
    public String getFormattedDuration() {
        if (duration == null) return null;
        int minutes = duration / 60;
        int seconds = duration % 60;
        return String.format("%d:%02d", minutes, seconds);
    }
}
