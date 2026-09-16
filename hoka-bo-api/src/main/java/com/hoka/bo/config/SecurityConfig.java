package com.hoka.bo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

// 무상태 REST API. 브라우저는 Next.js BFF를 거치고, 이 API는 Bearer 토큰만 받는다.
// 쿠키 세션이 없으므로 CSRF는 끈다. 인가 규칙은 Service 메서드의 @PreAuthorize에 있다.
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, BoJwtAuthenticationConverter converter)
            throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        // 로그인 전에 부르는 경로. 로그아웃은 만료된 토큰으로도 부를 수 있어야 한다.
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/invitations/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .build();
    }

}
