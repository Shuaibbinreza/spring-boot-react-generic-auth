package com.cmh.attendance.config;

import com.cmh.attendance.entity.Role;
import com.cmh.attendance.entity.User;
import com.cmh.attendance.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = User.builder()
                    .username("admin")
                    .email("admin@attendance.app")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .roles(Set.of(Role.ROLE_ADMIN, Role.ROLE_USER))
                    .build();

            userRepository.save(adminUser);
            logger.info("Default admin user created successfully [Username: admin, Email: admin@attendance.app]");
        } else {
            logger.info("Admin user already exists in the system.");
        }
    }
}
