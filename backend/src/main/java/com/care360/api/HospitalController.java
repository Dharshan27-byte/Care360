package com.care360.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {
    private final RestClient restClient;
    public HospitalController(RestClient restClient) { this.restClient = restClient; }

    @GetMapping
    public Map<String, Object> nearby(@RequestParam double lat, @RequestParam double lon,
                                      @RequestParam(defaultValue = "5000") int radius) {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new IllegalArgumentException("Location coordinates are not valid.");
        int safeRadius = Math.max(500, Math.min(radius, 20000));
        String query = "[out:json][timeout:20];(node[\"amenity\"~\"hospital|clinic\"](around:" + safeRadius + "," + lat + "," + lon + ");way[\"amenity\"~\"hospital|clinic\"](around:" + safeRadius + "," + lat + "," + lon + ");relation[\"amenity\"~\"hospital|clinic\"](around:" + safeRadius + "," + lat + "," + lon + "););out center tags;";
        try {
            JsonNode response = fetchFromOverpass("https://overpass-api.de/api/interpreter", query);
            if (response == null || !response.path("elements").isArray()) {
                response = fetchFromOverpass("https://overpass.kumi.systems/api/interpreter", query);
            }
            List<Map<String, Object>> hospitals = new ArrayList<>();
            if (response != null && response.path("elements").isArray()) {
                for (JsonNode element : response.path("elements")) {
                    JsonNode tags = element.path("tags");
                    String name = tags.path("name").asText("");
                    double itemLat = element.path("lat").asDouble(element.path("center").path("lat").asDouble(Double.NaN));
                    double itemLon = element.path("lon").asDouble(element.path("center").path("lon").asDouble(Double.NaN));
                    if (name.isBlank() || Double.isNaN(itemLat) || Double.isNaN(itemLon)) continue;
                    String kind = tags.path("amenity").asText("clinic");
                    double distanceKm = distance(lat, lon, itemLat, itemLon);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", element.path("type").asText() + "/" + element.path("id").asText());
                    item.put("name", name); item.put("type", kind); item.put("latitude", itemLat); item.put("longitude", itemLon);
                    item.put("distanceKm", Math.round(distanceKm * 10.0) / 10.0);
                    item.put("address", tags.path("addr:full").asText(tags.path("addr:street").asText("Address not listed")));
                    item.put("phone", tags.path("phone").asText(""));
                    item.put("mapUrl", "https://www.openstreetmap.org/?mlat=" + itemLat + "&mlon=" + itemLon + "#map=17/" + itemLat + "/" + itemLon);
                    hospitals.add(item);
                }
            }
            hospitals.sort(Comparator.comparingDouble(item -> ((Number) item.get("distanceKm")).doubleValue()));
            return Map.of("hospitals", hospitals.stream().limit(40).toList(), "source", "OpenStreetMap contributors", "radiusMeters", safeRadius);
        } catch (RestClientException exception) {
            throw new IllegalStateException("Nearby places are temporarily unavailable. Please open OpenStreetMap and try again.");
        }
    }

    private JsonNode fetchFromOverpass(String endpoint, String query) {
        return restClient.post().uri(endpoint)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("data=" + URLEncoder.encode(query, StandardCharsets.UTF_8))
                .retrieve().body(JsonNode.class);
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1), dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
