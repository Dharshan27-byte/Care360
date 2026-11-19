package com.care360.api;

import com.care360.api.ApiDtos.SymptomRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/symptoms")
public class SymptomController {
    private static final List<String> SYMPTOMS = List.of("fever", "cough", "sore throat", "headache", "fatigue", "nausea", "vomiting", "diarrhea", "stomach pain", "rash", "dizziness", "chest pain", "shortness of breath", "confusion", "sudden weakness", "severe bleeding");

    @GetMapping
    public Map<String, Object> symptoms() { return Map.of("symptoms", SYMPTOMS, "source", "Care360 educational symptom list"); }

    @PostMapping("/assess")
    public Map<String, Object> assess(@Valid @RequestBody SymptomRequest request) {
        Set<String> selected = new HashSet<>();
        request.symptoms().forEach(value -> selected.add(value.trim().toLowerCase(Locale.ROOT)));
        boolean emergency = selected.contains("chest pain") && selected.contains("shortness of breath")
                || selected.contains("severe bleeding") || selected.contains("sudden weakness")
                || selected.contains("confusion") || selected.contains("shortness of breath") && selected.contains("fainting");
        String level = emergency ? "Urgent help recommended" : selected.size() >= 4 ? "Speak with a clinician" : "General wellness information";
        String guidance = emergency
                ? "These symptoms can be urgent. Call your local emergency number (112 in India) now or go to the nearest emergency department. Do not wait for an online result."
                : selected.size() >= 4
                ? "Several symptoms are present. A qualified clinician can review your full history and advise you. Seek care sooner if symptoms worsen."
                : "Many everyday causes can produce these symptoms. Rest, drink fluids if appropriate, and monitor how you feel. Contact a clinician if symptoms persist or worsen.";
        return Map.of("urgency", level, "guidance", guidance, "symptomsReviewed", request.symptoms(),
                "disclaimer", "Care360 does not diagnose illness. This educational guidance is not a substitute for professional medical advice.");
    }
}
