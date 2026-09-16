package com.hoka.bo.config;

import com.hoka.bo.user.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// 사용자는 초대로만 생기고 초대는 슈퍼관리자만 할 수 있다. 첫 한 명은 여기서 만든다.
// 이미 슈퍼관리자가 있으면 아무것도 하지 않는다. 테스트는 각자 필요한 사용자를 만들므로 제외한다.
@Component
@Profile("!test")
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrap(UserMapper userMapper, PasswordEncoder passwordEncoder,
            @Value("${hoka.admin.email}") String email, @Value("${hoka.admin.password}") String password) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userMapper.countSuperAdmins() > 0) {
            return;
        }
        userMapper.insertSuperAdmin(email, "슈퍼관리자", passwordEncoder.encode(password));
        log.info("슈퍼관리자 계정을 만들었습니다: {}. 첫 로그인 뒤 비밀번호를 바꿔야 합니다.", email);
    }

}
