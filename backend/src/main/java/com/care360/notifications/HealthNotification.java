package com.care360.notifications;

import com.care360.user.AppUser;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class HealthNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(nullable = false, length = 120)
    private String title;
    @Column(nullable = false, length = 1000)
    private String message;
    @Column(name = "is_read", nullable = false)
    private boolean read = false;
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected HealthNotification() { }
    public HealthNotification(AppUser user, String title, String message) { this.user = user; this.title = title; this.message = message; }
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void markRead() { this.read = true; }
}
