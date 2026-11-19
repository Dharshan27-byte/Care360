package com.care360.api;

import com.care360.appointments.Appointment;
import com.care360.appointments.AppointmentRepository;
import com.care360.api.ApiDtos.EmergencyRequest;
import com.care360.emergency.EmergencyRequestRepository;
import com.care360.health.HealthMetric;
import com.care360.health.HealthMetricRepository;
import com.care360.notifications.HealthNotification;
import com.care360.notifications.NotificationRepository;
import com.care360.user.AppUser;
import com.care360.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import static com.care360.api.ApiDtos.*;

@RestController
@RequestMapping("/api")
public class HealthController {
    private final UserRepository users;
    private final HealthMetricRepository metrics;
    private final AppointmentRepository appointments;
    private final NotificationRepository notifications;
    private final EmergencyRequestRepository emergencies;

    public HealthController(UserRepository users, HealthMetricRepository metrics, AppointmentRepository appointments,
                            NotificationRepository notifications, EmergencyRequestRepository emergencies) {
        this.users = users; this.metrics = metrics; this.appointments = appointments;
        this.notifications = notifications; this.emergencies = emergencies;
    }

    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "ok", "service", "Care360 API"); }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(Principal principal) {
        List<HealthMetric> recent = metrics.findTop30ByUserEmailOrderByRecordedAtDesc(principal.getName());
        long upcoming = appointments.countByUserEmailAndAppointmentAtAfterAndStatus(principal.getName(), LocalDateTime.now(), "BOOKED")
                + appointments.countByUserEmailAndAppointmentAtAfterAndStatus(principal.getName(), LocalDateTime.now(), "PLANNED");
        return Map.of("upcomingAppointments", upcoming,
                "unreadNotifications", notifications.countByUserEmailAndReadFalse(principal.getName()),
                "metricsRecorded", metrics.countByUserEmail(principal.getName()),
                "latestMetric", recent.isEmpty() ? Map.of() : metricResponse(recent.get(0)));
    }

    @GetMapping("/metrics")
    public List<MetricResponse> metrics(Principal principal) {
        return metrics.findTop30ByUserEmailOrderByRecordedAtDesc(principal.getName()).stream().map(this::metricResponse).toList();
    }

    @PostMapping("/metrics")
    @ResponseStatus(HttpStatus.CREATED)
    public MetricResponse addMetric(Principal principal, @Valid @RequestBody MetricRequest request) {
        if (request.weightKg() == null && request.heightCm() == null && request.systolic() == null && request.diastolic() == null && request.heartRate() == null && request.bloodSugar() == null)
            throw new IllegalArgumentException("Enter at least one health measurement.");
        if ((request.systolic() == null) != (request.diastolic() == null)) throw new IllegalArgumentException("Enter both systolic and diastolic blood pressure values.");
        HealthMetric saved = metrics.save(new HealthMetric(user(principal), request.weightKg(), request.heightCm(), request.systolic(), request.diastolic(), request.heartRate(), request.bloodSugar()));
        return metricResponse(saved);
    }

    @GetMapping("/appointments")
    public List<AppointmentResponse> appointments(Principal principal) {
        return appointments.findByUserEmailOrderByAppointmentAtAsc(principal.getName()).stream().map(this::appointmentResponse).toList();
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse book(Principal principal, @Valid @RequestBody AppointmentRequest request) {
        AppUser account = user(principal);
        Appointment saved = appointments.save(new Appointment(account, request.doctorName().trim(), request.specialty().trim(),
                request.clinicName().trim(), request.appointmentAt(), request.notes() == null ? null : request.notes().trim()));
        notifications.save(new HealthNotification(account, "Appointment saved", "Your visit with " + saved.getDoctorName() + " has been added to your schedule."));
        return appointmentResponse(saved);
    }

    @DeleteMapping("/appointments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelAppointment(Principal principal, @PathVariable Long id) {
        Appointment item = appointments.findById(id).orElseThrow(() -> new NoSuchElementException("Appointment not found."));
        if (!item.getUser().getEmail().equals(principal.getName())) throw new NoSuchElementException("Appointment not found.");
        item.cancel(); appointments.save(item);
    }

    @GetMapping("/notifications")
    public List<Map<String, Object>> notifications(Principal principal) {
        return notifications.findTop50ByUserEmailOrderByCreatedAtDesc(principal.getName()).stream().map(this::notificationResponse).toList();
    }

    @PatchMapping("/notifications/{id}/read")
    public Map<String, Object> markRead(Principal principal, @PathVariable Long id) {
        HealthNotification item = notification(principal, id); item.markRead(); return notificationResponse(notifications.save(item));
    }

    @DeleteMapping("/notifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(Principal principal, @PathVariable Long id) { notifications.delete(notification(principal, id)); }

    @PostMapping("/emergency")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> emergency(Principal principal, @Valid @RequestBody(required = false) EmergencyRequest request) {
        Double latitude = request == null ? null : request.latitude();
        Double longitude = request == null ? null : request.longitude();
        var saved = emergencies.save(new com.care360.emergency.EmergencyRequest(user(principal), latitude, longitude));
        String mapUrl = latitude == null || longitude == null ? "https://www.google.com/maps/search/hospitals+near+me" : "https://www.google.com/maps/search/hospitals/@" + latitude + "," + longitude + ",14z";
        return Map.of("id", saved.getId(), "status", saved.getStatus(), "message", "Your emergency request was saved on this account. Care360 does not dispatch emergency services.", "emergencyNumber", "112", "mapUrl", mapUrl);
    }

    @GetMapping("/tips/today")
    public Map<String, String> todayTip() {
        String[] tips = {"A short walk after meals can support your daily movement routine.", "Keep a water bottle nearby and drink regularly through the day.", "Try to keep a consistent sleep and wake time this week.", "Take a brief screen break and stretch your shoulders and back.", "Add a fruit or vegetable to one meal today."};
        return Map.of("date", LocalDate.now().toString(), "tip", tips[LocalDate.now().getDayOfYear() % tips.length]);
    }

    private AppUser user(Principal principal) { return users.findByEmail(principal.getName()).orElseThrow(() -> new NoSuchElementException("Account not found.")); }
    private HealthNotification notification(Principal principal, Long id) {
        HealthNotification item = notifications.findById(id).orElseThrow(() -> new NoSuchElementException("Notification not found."));
        if (!item.getUser().getEmail().equals(principal.getName())) throw new NoSuchElementException("Notification not found.");
        return item;
    }
    private MetricResponse metricResponse(HealthMetric m) { return new MetricResponse(m.getId(), m.getWeightKg(), m.getHeightCm(), m.getSystolic(), m.getDiastolic(), m.getHeartRate(), m.getBloodSugar(), m.getRecordedAt()); }
    private AppointmentResponse appointmentResponse(Appointment a) { return new AppointmentResponse(a.getId(), a.getDoctorName(), a.getSpecialty(), a.getClinicName(), a.getAppointmentAt(), a.getStatus(), a.getNotes()); }
    private Map<String, Object> notificationResponse(HealthNotification n) { return Map.of("id", n.getId(), "title", n.getTitle(), "message", n.getMessage(), "read", n.isRead(), "createdAt", n.getCreatedAt()); }
}
