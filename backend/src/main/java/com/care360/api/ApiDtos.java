package com.care360.api;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() { }
    public record RegisterRequest(@NotBlank @Size(max = 100) String name, @NotBlank @Email @Size(max = 190) String email,
                                  @NotBlank @Size(min = 8, max = 72) String password) { }
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
    public record UserResponse(Long id, String name, String email, String phone, LocalDateTime createdAt) { }
    public record AuthResponse(String token, UserResponse user) { }
    public record ProfileUpdate(@NotBlank @Size(max = 100) String name, @Size(max = 30) String phone) { }
    public record MetricRequest(@DecimalMin("1.0") @DecimalMax("500.0") Double weightKg,
                                @DecimalMin("20.0") @DecimalMax("260.0") Double heightCm,
                                @Min(40) @Max(300) Integer systolic, @Min(20) @Max(200) Integer diastolic,
                                @Min(20) @Max(250) Integer heartRate,
                                @DecimalMin("1.0") @DecimalMax("2000.0") Double bloodSugar) { }
    public record MetricResponse(Long id, Double weightKg, Double heightCm, Integer systolic, Integer diastolic,
                                 Integer heartRate, Double bloodSugar, LocalDateTime recordedAt) { }
    public record AppointmentRequest(@NotBlank @Size(max = 120) String doctorName,
                                     @NotBlank @Size(max = 120) String specialty,
                                     @NotBlank @Size(max = 160) String clinicName,
                                     @NotNull @Future LocalDateTime appointmentAt,
                                     @Size(max = 500) String notes) { }
    public record AppointmentResponse(Long id, String doctorName, String specialty, String clinicName,
                                      LocalDateTime appointmentAt, String status, String notes) { }
    public record SymptomRequest(@NotEmpty @Size(max = 12) List<@NotBlank @Size(max = 80) String> symptoms) { }
    public record EmergencyRequest(@DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
                                   @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude) { }
}
