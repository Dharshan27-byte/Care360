package com.care360.health;

import com.care360.user.AppUser;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_metrics")
public class HealthMetric {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private AppUser user;
    private Double weightKg;
    private Double heightCm;
    private Integer systolic;
    private Integer diastolic;
    private Integer heartRate;
    private Double bloodSugar;
    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt = LocalDateTime.now();

    protected HealthMetric() { }
    public HealthMetric(AppUser user, Double weightKg, Double heightCm, Integer systolic, Integer diastolic, Integer heartRate, Double bloodSugar) {
        this.user = user; this.weightKg = weightKg; this.heightCm = heightCm; this.systolic = systolic;
        this.diastolic = diastolic; this.heartRate = heartRate; this.bloodSugar = bloodSugar;
    }
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Double getWeightKg() { return weightKg; }
    public Double getHeightCm() { return heightCm; }
    public Integer getSystolic() { return systolic; }
    public Integer getDiastolic() { return diastolic; }
    public Integer getHeartRate() { return heartRate; }
    public Double getBloodSugar() { return bloodSugar; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
}
