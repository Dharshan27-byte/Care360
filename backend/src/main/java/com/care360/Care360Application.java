package com.care360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class Care360Application {
    public static void main(String[] args) {
        SpringApplication.run(Care360Application.class, args);
    }
}
