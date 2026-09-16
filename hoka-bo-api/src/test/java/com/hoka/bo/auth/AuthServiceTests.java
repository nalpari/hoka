package com.hoka.bo.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class AuthServiceTests extends DatabaseTest {

    private static final String PASSWORD = "hoka-pass-1";

    @Autowired
    AuthService auth;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JdbcClient jdbc;

    @Test
    void issuesTokensAndRecordsSuccess() {
        long id = activeUser("ok@hoka.co.kr", "CS");

        TokenPair tokens = auth.login("ok@hoka.co.kr", PASSWORD, false, "127.0.0.1", "JUnit");

        assertThat(tokens.accessToken()).isNotBlank();
        assertThat(tokens.expiresInSeconds()).isEqualTo(900);
        assertThat(lastHistory(id)).isEqualTo("SUCCESS");
        assertThat(jdbc.sql("select count(*) from bo_refresh_token where user_id = ?")
                .param(id).query(Long.class).single()).isEqualTo(1);
    }

    @Test
    void emailIsNotCaseSensitive() {
        activeUser("case@hoka.co.kr", "CS");

        assertThat(auth.login("CASE@HOKA.CO.KR", PASSWORD, false, null, null).accessToken()).isNotBlank();
    }

    @Test
    void countsFailuresAndLocksOnTheFifth() {
        long id = activeUser("fail@hoka.co.kr", "CS");

        for (int attempt = 1; attempt <= 4; attempt++) {
            assertThatThrownBy(() -> auth.login("fail@hoka.co.kr", "wrong", false, null, null))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
        }
        assertThat(status(id)).isEqualTo("ACTIVE");

        assertThatThrownBy(() -> auth.login("fail@hoka.co.kr", "wrong", false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_LOCKED"));

        assertThat(status(id)).isEqualTo("LOCKED");
        assertThat(lockReason(id)).isEqualTo("PASSWORD_FAILED");
        assertThat(lastHistory(id)).isEqualTo("LOCKED");
        // 잠긴 뒤에는 올바른 비밀번호도 통하지 않는다.
        assertThatThrownBy(() -> auth.login("fail@hoka.co.kr", PASSWORD, false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_LOCKED"));
    }

    @Test
    void successResetsTheFailureCount() {
        long id = activeUser("reset@hoka.co.kr", "CS");
        assertThatThrownBy(() -> auth.login("reset@hoka.co.kr", "wrong", false, null, null))
                .isInstanceOf(ApiException.class);

        auth.login("reset@hoka.co.kr", PASSWORD, false, null, null);

        assertThat(jdbc.sql("select failed_login_count from bo_user where id = ?")
                .param(id).query(Integer.class).single()).isZero();
    }

    @Test
    void unknownEmailLooksExactlyLikeAWrongPassword() {
        assertThatThrownBy(() -> auth.login("nobody@hoka.co.kr", PASSWORD, false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
        // 흔적은 남긴다. 무차별 대입을 보기 위해서다.
        assertThat(jdbc.sql("select count(*) from bo_login_history where email = 'nobody@hoka.co.kr' and user_id is null")
                .query(Long.class).single()).isEqualTo(1);
    }

    @Test
    void invitedAndInactiveAccountsGetTheSameAnswer() {
        jdbc.sql("""
                insert into bo_user (email, name, role_code, status, invite_token_hash, invite_expires_at)
                values ('invited@hoka.co.kr', '초대', 'CS', 'INVITED', 'h', now() + interval '1 day')
                """).update();
        long inactive = activeUser("gone@hoka.co.kr", "CS");
        jdbc.sql("update bo_user set status = 'INACTIVE' where id = ?").param(inactive).update();

        assertThatThrownBy(() -> auth.login("invited@hoka.co.kr", PASSWORD, false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
        assertThatThrownBy(() -> auth.login("gone@hoka.co.kr", PASSWORD, false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
    }

    @Test
    void locksAnAccountLeftUnusedForNinetyDays() {
        long id = activeUser("old@hoka.co.kr", "CS");
        jdbc.sql("update bo_user set last_login_at = now() - interval '91 days' where id = ?").param(id).update();

        assertThatThrownBy(() -> auth.login("old@hoka.co.kr", PASSWORD, false, null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_LOCKED"));

        assertThat(lockReason(id)).isEqualTo("DORMANT");
    }

    @Test
    void rotatesRefreshTokensAndRefusesTheUsedOne() {
        activeUser("rot@hoka.co.kr", "CS");
        TokenPair first = auth.login("rot@hoka.co.kr", PASSWORD, false, null, null);

        TokenPair second = auth.refresh(first.refreshToken(), null, null);

        assertThat(second.refreshToken()).isNotEqualTo(first.refreshToken());
        assertThatThrownBy(() -> auth.refresh(first.refreshToken(), null, null))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("REFRESH_INVALID"));
    }

    @Test
    void logoutDropsTheRefreshToken() {
        long id = activeUser("out@hoka.co.kr", "CS");
        TokenPair tokens = auth.login("out@hoka.co.kr", PASSWORD, false, null, null);

        auth.logout(tokens.refreshToken());

        assertThat(jdbc.sql("select count(*) from bo_refresh_token where user_id = ?")
                .param(id).query(Long.class).single()).isZero();
    }

    @Test
    void authoritiesFollowTheRoleAndAreReadEveryTime() {
        long id = activeUser("cs@hoka.co.kr", "CS");

        assertThat(auth.authorities(id)).contains("OPS_CLAIMS:C", "OPS_CLAIMS:R", "MBR_MEMBERS:R")
                .doesNotContain("STL_TAX:R");

        jdbc.sql("update bo_user set role_code = 'SUPER_ADMIN' where id = ?").param(id).update();
        assertThat(auth.authorities(id)).containsExactly("SUPER");
    }

    @Test
    void temporaryPasswordLimitsTheAccountToChangingIt() {
        long id = activeUser("temp@hoka.co.kr", "CS");
        jdbc.sql("update bo_user set password_change_required = true where id = ?").param(id).update();

        assertThat(auth.authorities(id)).containsExactly("PASSWORD_CHANGE_REQUIRED");
    }

    @Test
    void inactiveAccountLosesItsAuthorities() {
        long id = activeUser("dead@hoka.co.kr", "CS");
        jdbc.sql("update bo_user set status = 'INACTIVE' where id = ?").param(id).update();

        assertThatThrownBy(() -> auth.authorities(id))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("ACCOUNT_NOT_ACTIVE"));
    }

    @Test
    void changingThePasswordClearsTheForcedChangeFlag() {
        long id = activeUser("pw@hoka.co.kr", "CS");
        jdbc.sql("update bo_user set password_change_required = true where id = ?").param(id).update();
        login(id);

        auth.changePassword(PASSWORD, "hoka-pass-2");

        assertThat(jdbc.sql("select password_change_required from bo_user where id = ?")
                .param(id).query(Boolean.class).single()).isFalse();
        assertThat(auth.login("pw@hoka.co.kr", "hoka-pass-2", false, null, null).accessToken()).isNotBlank();
    }

    @Test
    void refusesAWrongCurrentPasswordOrAShortOrUnchangedNewOne() {
        long id = activeUser("pw2@hoka.co.kr", "CS");
        login(id);

        assertThatThrownBy(() -> auth.changePassword("wrong", "hoka-pass-2"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVALID_CREDENTIALS"));
        assertThatThrownBy(() -> auth.changePassword(PASSWORD, "short"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("PASSWORD_TOO_SHORT"));
        assertThatThrownBy(() -> auth.changePassword(PASSWORD, PASSWORD))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("PASSWORD_UNCHANGED"));
    }

    @Test
    void meListsOnlyTheMenusTheRoleCanRead() {
        long id = activeUser("menu@hoka.co.kr", "CS");
        login(id);

        Me me = auth.me();

        assertThat(me.roleCode()).isEqualTo("CS");
        assertThat(me.menus()).extracting(MenuAccess::code)
                .containsExactlyInAnyOrder("OPS_DASHBOARD", "OPS_ORDERS", "OPS_CLAIMS", "OPS_INQUIRIES",
                        "MBR_MEMBERS");
    }

    // 아래 두 테스트는 테스트 트랜잭션 밖에서 돈다. 감싸는 트랜잭션 안에서 단언하면 커밋되지 않은 값을
    // 보게 되어, 롤백으로 기록이 사라지는 결함과 동시성 문제를 둘 다 놓친다. 대신 각자 뒷정리를 한다.

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void failureCountersAndLockSurviveTheRejectedRequest() {
        String email = "persist@hoka.co.kr";
        long id = activeUser(email, "CS");
        try {
            for (int attempt = 1; attempt <= 5; attempt++) {
                assertThatThrownBy(() -> auth.login(email, "wrong", false, null, null))
                        .isInstanceOf(ApiException.class);
            }

            // 요청이 401로 끝나도 실패 횟수·잠금·이력은 커밋돼 있어야 한다.
            assertThat(jdbc.sql("select failed_login_count from bo_user where id = ?")
                    .param(id).query(Integer.class).single()).isEqualTo(5);
            assertThat(status(id)).isEqualTo("LOCKED");
            assertThat(lockReason(id)).isEqualTo("PASSWORD_FAILED");
            assertThat(jdbc.sql("select count(*) from bo_login_history where user_id = ?")
                    .param(id).query(Long.class).single()).isEqualTo(5);
        } finally {
            cleanUp(id);
        }
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void onlyOneOfTwoConcurrentRefreshesSucceeds() throws Exception {
        String email = "race@hoka.co.kr";
        long id = activeUser(email, "CS");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            String refreshToken = auth.login(email, PASSWORD, false, null, null).refreshToken();
            Callable<TokenPair> call = () -> auth.refresh(refreshToken, null, null);

            List<Future<TokenPair>> results = pool.invokeAll(List.of(call, call));

            List<TokenPair> issued = new ArrayList<>();
            List<Throwable> rejected = new ArrayList<>();
            for (Future<TokenPair> result : results) {
                try {
                    issued.add(result.get());
                } catch (Exception e) {
                    rejected.add(e.getCause());
                }
            }
            assertThat(issued).hasSize(1);
            assertThat(rejected).hasSize(1).first().isInstanceOfSatisfying(ApiException.class,
                    e -> assertThat(e.getCode()).isEqualTo("REFRESH_INVALID"));
            // 살아남은 세션도 하나뿐이어야 한다.
            assertThat(jdbc.sql("select count(*) from bo_refresh_token where user_id = ?")
                    .param(id).query(Long.class).single()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
            cleanUp(id);
        }
    }

    // 메뉴 관리에서 제한을 좁히면 이미 나가 있던 역할 권한도 그 순간 효력을 잃어야 한다.
    // bo_role_menu의 행은 그대로 남으므로, 판정이 bo_menu를 보지 않으면 권한이 계속 살아 있다.
    @Test
    void dropsAuthoritiesTheMenuNoLongerUses() {
        long id = activeUser("narrow@hoka.co.kr", "OPS_ADMIN");
        assertThat(auth.authorities(id)).contains("OPS_ORDERS:U", "OPS_ORDERS:R");

        jdbc.sql("update bo_menu set use_update = false where code = 'OPS_ORDERS'").update();

        assertThat(auth.authorities(id)).doesNotContain("OPS_ORDERS:U").contains("OPS_ORDERS:R");
    }

    @Test
    void dropsAuthoritiesOnAMenuMadeExclusive() {
        long id = activeUser("exclusive@hoka.co.kr", "OPS_ADMIN");
        assertThat(auth.authorities(id)).contains("SYS_USERS:R");

        jdbc.sql("update bo_menu set exclusive_role_code = 'SUPER_ADMIN' where code = 'SYS_USERS'").update();

        assertThat(auth.authorities(id)).doesNotContain("SYS_USERS:R");
        login(id);
        assertThat(auth.me().menus()).extracting(MenuAccess::code).doesNotContain("SYS_USERS");
    }

    private void cleanUp(long id) {
        jdbc.sql("delete from bo_refresh_token where user_id = ?").param(id).update();
        jdbc.sql("delete from bo_login_history where user_id = ?").param(id).update();
        jdbc.sql("delete from bo_user where id = ?").param(id).update();
    }

    private long activeUser(String email, String roleCode) {
        return jdbc.sql("""
                insert into bo_user (email, name, department, role_code, status, password_hash, password_changed_at)
                values (?, '테스트', 'CS팀', ?, 'ACTIVE', ?, now())
                returning id
                """).params(email, roleCode, passwordEncoder.encode(PASSWORD)).query(Long.class).single();
    }

    // access 토큰의 sub가 곧 사용자 id다.
    private void login(long id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                String.valueOf(id), "n/a", List.of(new SimpleGrantedAuthority("SUPER"))));
    }

    private String status(long id) {
        return jdbc.sql("select status from bo_user where id = ?").param(id).query(String.class).single();
    }

    private String lockReason(long id) {
        return jdbc.sql("select lock_reason from bo_user where id = ?").param(id).query(String.class).single();
    }

    private String lastHistory(long id) {
        return jdbc.sql("select result from bo_login_history where user_id = ? order by id desc limit 1")
                .param(id).query(String.class).single();
    }

}
