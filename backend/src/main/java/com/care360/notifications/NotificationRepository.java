package com.care360.notifications;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<HealthNotification, Long> {
    List<HealthNotification> findTop50ByUserEmailOrderByCreatedAtDesc(String email);
    long countByUserEmailAndReadFalse(String email);
}
