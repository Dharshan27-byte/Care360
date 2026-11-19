package com.care360.appointments;

import com.care360.user.AppUser;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private AppUser user;
    @Column(nullable = false, length = 120)
    private String doctorName;
    @Column(nullable = false, length = 120)
    private String specialty;
    @Column(nullable = false, length = 160)
    private String clinicName;
    @Column(nullable = false)
    private LocalDateTime appointmentAt;
    @Column(nullable = false, length = 24)
    private String status = "PLANNED";
    @Column(length = 500)
    private String notes;
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected Appointment() { }
    public Appointment(AppUser user, String doctorName, String specialty, String clinicName, LocalDateTime appointmentAt, String notes) {
        this.user = user; this.doctorName = doctorName; this.specialty = specialty; this.clinicName = clinicName;
        this.appointmentAt = appointmentAt; this.notes = notes;
    }
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public String getDoctorName() { return doctorName; }
    public String getSpecialty() { return specialty; }
    public String getClinicName() { return clinicName; }
    public LocalDateTime getAppointmentAt() { return appointmentAt; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public void cancel() { this.status = "CANCELLED"; }
}
