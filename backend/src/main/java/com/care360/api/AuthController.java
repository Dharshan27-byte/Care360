package com.care360.api;

import com.care360.security.JwtService;
import com.care360.user.AppUser;
import com.care360.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

import static com.care360.api.ApiDtos.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder passwords, JwtService jwt) {
        this.users = users; this.passwords = passwords; this.jwt = jwt;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) throw new IllegalArgumentException("An account with this email already exists.");
        AppUser user = users.save(new AppUser(request.name().trim(), email, passwords.encode(request.password())));
        return new AuthResponse(jwt.createToken(email), toResponse(user));
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        AppUser user = users.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Email or password is incorrect."));
        if (!passwords.matches(request.password(), user.getPasswordHash())) throw new IllegalArgumentException("Email or password is incorrect.");
        return new AuthResponse(jwt.createToken(email), toResponse(user));
    }

    @GetMapping("/profile")
    public UserResponse profile(Principal principal) { return toResponse(find(principal.getName())); }

    @PutMapping("/profile")
    public UserResponse updateProfile(Principal principal, @Valid @RequestBody ProfileUpdate request) {
        AppUser user = find(principal.getName());
        user.setName(request.name().trim());
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        return toResponse(users.save(user));
    }

    private AppUser find(String email) { return users.findByEmail(email).orElseThrow(() -> new NoSuchElementException("Account not found.")); }
    private UserResponse toResponse(AppUser user) { return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getCreatedAt()); }
}
