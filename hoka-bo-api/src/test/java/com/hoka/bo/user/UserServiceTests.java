package com.hoka.bo.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import com.hoka.bo.common.ApiException;
import com.hoka.bo.common.Tokens;
import com.hoka.bo.support.DatabaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

// 시드에는 사용자가 없다. 필요한 사용자만 테스트에서 만든다.
@Transactional
@WithMockUser(authorities = "SUPER")
class UserServiceTests extends DatabaseTest {

    @Autowired
    UserService users;

    @Autowired
    JdbcClient jdbc;

    @Test
    void invitesWithALinkAndStoresOnlyTheTokenHash() {
        Invitation invitation = users.invite("new@hoka.co.kr", "신규", "이커머스팀", "CS");

        assertThat(invitation.inviteUrl()).startsWith("http://localhost:3000/invite/");
        String token = invitation.inviteUrl().substring(invitation.inviteUrl().lastIndexOf('/') + 1);
        assertThat(users.find(invitation.userId()).status()).isEqualTo("INVITED");
        assertThat(jdbc.sql("select invite_token_hash from bo_user where id = ?")
                .param(invitation.userId()).query(String.class).single())
                .isEqualTo(Tokens.hash(token))
                .isNotEqualTo(token);
    }

    @Test
    void rejectsDuplicateEmailIgnoringCase() {
        users.invite("dup@hoka.co.kr", "먼저", null, "CS");

        assertThatThrownBy(() -> users.invite("DUP@hoka.co.kr", "나중", null, "CS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("EMAIL_DUPLICATE"));
    }

    @Test
    void acceptingAnInviteActivatesTheAccount() {
        Invitation invitation = users.invite("accept@hoka.co.kr", "수락", null, "CS");
        String token = invitation.inviteUrl().substring(invitation.inviteUrl().lastIndexOf('/') + 1);

        users.acceptInvite(token, "hoka-pass-1");

        assertThat(users.find(invitation.userId()).status()).isEqualTo("ACTIVE");
        // 토큰은 한 번만 쓸 수 있다.
        assertThatThrownBy(() -> users.acceptInvite(token, "hoka-pass-1"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVITE_INVALID"));
    }

    @Test
    void rejectsShortPasswordOnAccept() {
        Invitation invitation = users.invite("short@hoka.co.kr", "짧은", null, "CS");
        String token = invitation.inviteUrl().substring(invitation.inviteUrl().lastIndexOf('/') + 1);

        assertThatThrownBy(() -> users.acceptInvite(token, "1234"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("PASSWORD_TOO_SHORT"));
        assertThat(users.find(invitation.userId()).status()).isEqualTo("INVITED");
    }

    @Test
    void expiredInviteIsRefused() {
        Invitation invitation = users.invite("old@hoka.co.kr", "만료", null, "CS");
        String token = invitation.inviteUrl().substring(invitation.inviteUrl().lastIndexOf('/') + 1);
        jdbc.sql("update bo_user set invite_expires_at = now() - interval '1 hour' where id = ?")
                .param(invitation.userId()).update();

        assertThatThrownBy(() -> users.acceptInvite(token, "hoka-pass-1"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("INVITE_INVALID"));
    }

    @Test
    void unlocksWithATemporaryPasswordThatMustBeChanged() {
        long id = activeUser("locked@hoka.co.kr", "잠김", "CS");
        jdbc.sql("""
                update bo_user set status = 'LOCKED', lock_reason = 'PASSWORD_FAILED',
                       locked_at = now(), failed_login_count = 5 where id = ?
                """).param(id).update();

        String temporary = users.unlock(id);

        UserDetail unlocked = users.find(id);
        assertThat(temporary).hasSize(12);
        assertThat(unlocked.status()).isEqualTo("ACTIVE");
        assertThat(unlocked.lockReason()).isNull();
        assertThat(unlocked.passwordChangeRequired()).isTrue();
    }

    @Test
    void refusesToUnlockAnAccountThatIsNotLocked() {
        long id = activeUser("fine@hoka.co.kr", "정상", "CS");

        assertThatThrownBy(() -> users.unlock(id))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("NOT_LOCKED"));
    }

    @Test
    void deactivationDropsRefreshTokens() {
        long id = activeUser("bye@hoka.co.kr", "퇴사", "CS");
        jdbc.sql("insert into bo_refresh_token (user_id, token_hash, expires_at) values (?, 'h', now() + interval '1 day')")
                .param(id).update();

        users.deactivate(List.of(id));

        assertThat(users.find(id).status()).isEqualTo("INACTIVE");
        assertThat(jdbc.sql("select count(*) from bo_refresh_token where user_id = ?")
                .param(id).query(Long.class).single()).isZero();
    }

    @Test
    void keepsTheLastActiveSuperAdmin() {
        long superId = activeUser("boss@hoka.co.kr", "슈퍼", "SUPER_ADMIN");

        assertThatThrownBy(() -> users.deactivate(List.of(superId)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("LAST_SUPER_ADMIN"));
        assertThatThrownBy(() -> users.changeRole(List.of(superId), "CS"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("LAST_SUPER_ADMIN"));
    }

    @Test
    void allowsDemotingASuperAdminWhenAnotherOneRemains() {
        long first = activeUser("boss1@hoka.co.kr", "슈퍼1", "SUPER_ADMIN");
        activeUser("boss2@hoka.co.kr", "슈퍼2", "SUPER_ADMIN");

        users.changeRole(List.of(first), "CS");

        assertThat(users.find(first).roleCode()).isEqualTo("CS");
    }

    @Test
    void refusesToDeactivateYourself() {
        long id = activeUser("me@hoka.co.kr", "나", "CS");
        // access 토큰의 sub가 곧 사용자 id다. 그 사용자로 로그인한 상태를 흉내 낸다.
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                String.valueOf(id), "n/a", List.of(new SimpleGrantedAuthority("SUPER"))));

        assertThatThrownBy(() -> users.deactivate(List.of(id)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("SELF_DEACTIVATION"));
    }

    @Test
    void searchesByKeywordStatusAndRole() {
        activeUser("kim@hoka.co.kr", "김서연", "CS");
        long locked = activeUser("han@hoka.co.kr", "한지우", "CS");
        jdbc.sql("update bo_user set status = 'LOCKED', lock_reason = 'PASSWORD_FAILED', locked_at = now() where id = ?")
                .param(locked).update();

        UserPage byKeyword = users.search(new UserSearch("한지", null, null, null, 0, 20));
        assertThat(byKeyword.items()).extracting(UserRow::email).containsExactly("han@hoka.co.kr");

        UserPage byStatus = users.search(new UserSearch(null, List.of("LOCKED"), null, null, 0, 20));
        assertThat(byStatus.total()).isEqualTo(1);
        assertThat(byStatus.statusCounts()).containsEntry("ACTIVE", 1).containsEntry("LOCKED", 1);
    }

    @Test
    void listsRecentLoginAttemptsNewestFirst() {
        long id = activeUser("log@hoka.co.kr", "이력", "CS");
        jdbc.sql("""
                insert into bo_login_history (user_id, email, result, created_at) values
                    (?, 'log@hoka.co.kr', 'SUCCESS', now() - interval '2 hour'),
                    (?, 'log@hoka.co.kr', 'FAILED', now() - interval '1 hour')
                """).params(id, id).update();

        assertThat(users.findLoginHistory(id, 20)).extracting("result").containsExactly("FAILED", "SUCCESS");
    }

    @Test
    @WithMockUser(authorities = "SYS_USERS:R")
    void readOnlyAuthorityCannotWrite() {
        assertThat(users.search(new UserSearch(null, null, null, null, 0, 20)).items()).isEmpty();
        assertThatThrownBy(() -> users.invite("x@hoka.co.kr", "x", null, "CS"))
                .isInstanceOf(AccessDeniedException.class);
    }

    private long activeUser(String email, String name, String roleCode) {
        return jdbc.sql("""
                insert into bo_user (email, name, department, role_code, status, password_hash, password_changed_at)
                values (?, ?, '이커머스팀', ?, 'ACTIVE', 'x', now())
                returning id
                """).params(email, name, roleCode).query(Long.class).single();
    }

}
