package com.care360.appointments;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserEmailOrderByAppointmentAtAsc(String email);
    long countByUserEmailAndAppointmentAtAfterAndStatus(String email, LocalDateTime after, String status);
}
