package com.hoka.bo.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.imageio.ImageIO;

import com.hoka.bo.common.ApiException;
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
class AvatarServiceTests extends DatabaseTest {

    @Autowired
    AvatarService avatars;

    @Autowired
    JdbcClient jdbc;

    @Test
    void storesAnySizeAsOneSquarePng() throws IOException {
        long id = user("wide@hoka.co.kr");

        avatars.replace(id, png(400, 200));

        BufferedImage stored = ImageIO.read(new ByteArrayInputStream(avatars.find(id)));
        assertThat(stored.getWidth()).isEqualTo(AvatarService.SIZE);
        assertThat(stored.getHeight()).isEqualTo(AvatarService.SIZE);
        assertThat(updatedAt(id)).isNotNull();
    }

    @Test
    void rejectsSomethingThatIsNotAnImage() {
        long id = user("text@hoka.co.kr");

        assertThatThrownBy(() -> avatars.replace(id, "not an image".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("AVATAR_NOT_IMAGE"));
    }

    @Test
    void deletingClearsThePhotoAndItsTimestampTogether() throws IOException {
        long id = user("clear@hoka.co.kr");
        avatars.replace(id, png(64, 64));

        avatars.delete(id);

        assertThat(updatedAt(id)).isNull();
        assertThatThrownBy(() -> avatars.find(id))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("AVATAR_NOT_FOUND"));
    }

    @Test
    void aPlainUserMayChangeTheirOwnPhoto() throws IOException {
        long id = user("self@hoka.co.kr");
        loginAs(id);

        avatars.replace(id, png(64, 64));

        assertThat(updatedAt(id)).isNotNull();
    }

    @Test
    void aPlainUserMayNotChangeSomeoneElsesPhoto() throws IOException {
        long me = user("me@hoka.co.kr");
        long other = user("other@hoka.co.kr");
        loginAs(me);

        byte[] photo = png(64, 64);
        assertThatThrownBy(() -> avatars.replace(other, photo)).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> avatars.delete(other)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void refusesAPhotoForSomeoneWhoDoesNotExist() throws IOException {
        byte[] photo = png(64, 64);
        assertThatThrownBy(() -> avatars.replace(9_999_999L, photo))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getCode()).isEqualTo("USER_NOT_FOUND"));
    }

    // 자기 사진만 바꿀 수 있는 평범한 사용자로 로그인한 상태를 흉내 낸다(sub가 곧 사용자 id다).
    private void loginAs(long id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                String.valueOf(id), "n/a", List.of(new SimpleGrantedAuthority("SYS_USERS:R"))));
    }

    private java.time.Instant updatedAt(long id) {
        return jdbc.sql("select avatar_updated_at from bo_user where id = ?")
                .param(id).query(java.time.Instant.class).optional().orElse(null);
    }

    private long user(String email) {
        return jdbc.sql("""
                insert into bo_user (email, name, department, role_code, status, password_hash, password_changed_at)
                values (?, '테스터', '이커머스팀', 'CS', 'ACTIVE', 'x', now())
                returning id
                """).param(email).query(Long.class).single();
    }

    private static byte[] png(int width, int height) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", out);
        return out.toByteArray();
    }

}
