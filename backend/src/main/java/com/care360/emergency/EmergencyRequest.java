package com.care360.emergency;

import com.care360.user.AppUser;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_requests")
public class EmergencyRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private AppUser user;
    private Double latitude;
    private Double longitude;
    @Column(nullable = false, length = 24)
    private String status = "REQUESTED";
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected EmergencyRequest() { }
    public EmergencyRequest(AppUser user, Double latitude, Double longitude) { this.user = user; this.latitude = latitude; this.longitude = longitude; }
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
