package com.hoka.bo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 공개 경로 몇 개를 빼면 전부 Bearer 토큰이 필요하다. Authorize 버튼이 없으면
// Swagger UI에서 호출이 모두 401이 되므로 보안 스킴을 함께 알려 준다.
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI hokaBoOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("HOKA 백오피스 API")
                        .version("v1")
                        .description("""
                                POST /api/auth/login으로 받은 accessToken을 Authorize에 넣고 호출한다.
                                권한은 요청마다 DB에서 읽으므로 역할·권한을 바꾸면 곧바로 반영된다."""))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }

}
