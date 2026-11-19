package com.care360.health;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {
    List<HealthMetric> findTop30ByUserEmailOrderByRecordedAtDesc(String email);
    long countByUserEmail(String email);
}
