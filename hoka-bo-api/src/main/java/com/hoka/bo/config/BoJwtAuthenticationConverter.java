package com.hoka.bo.config;

import java.util.List;

import com.hoka.bo.auth.AuthService;
import com.hoka.bo.common.ApiException;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

// 토큰에는 sub(사용자 id)만 들어 있다. 권한은 요청마다 DB에서 읽어 잠금·역할 변경·권한 저장을 즉시 반영한다.
@Component
public class BoJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final AuthService authService;

    public BoJwtAuthenticationConverter(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        long userId;
        try {
            userId = Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new InvalidBearerTokenException("sub가 사용자 id가 아닙니다.");
        }
        List<String> authorities;
        try {
            authorities = authService.authorities(userId);
        } catch (ApiException e) {
            // 잠겼거나 비활성화된 계정은 토큰이 아직 살아 있어도 통과시키지 않는다.
            throw new InvalidBearerTokenException(e.getBody().getDetail());
        }
        return new JwtAuthenticationToken(jwt, authorities.stream().map(SimpleGrantedAuthority::new).toList(),
                jwt.getSubject());
    }

}
