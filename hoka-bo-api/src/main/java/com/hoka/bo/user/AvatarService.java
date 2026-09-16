package com.hoka.bo.user;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import com.hoka.bo.common.ApiException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 프로필 사진. 올라온 파일이 무엇이든 128x128 PNG 한 장으로 바꿔 저장한다.
 * 원본을 그대로 두지 않으므로 화면마다 크기가 다른 아바타(20·26·44px)도 한 장으로 덮는다.
 */
@Service
@Transactional(readOnly = true)
public class AvatarService {

    static final int SIZE = 128;
    // 파일 크기는 작아도 픽셀 수는 얼마든지 클 수 있다(압축 폭탄). 디코드 전에 치수로 막는다.
    private static final long MAX_PIXELS = 50_000_000L;

    private final UserMapper userMapper;

    public AvatarService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /** 로그인한 사람은 누구나 본다. 목록·역할 구성원·레일이 남의 아바타를 그린다. */
    @PreAuthorize("isAuthenticated()")
    public byte[] find(long id) {
        Avatar avatar = userMapper.findAvatar(id);
        if (avatar == null || avatar.png() == null) {
            throw ApiException.notFound("AVATAR_NOT_FOUND", "사진이 없는 사용자입니다: " + id);
        }
        return avatar.png();
    }

    @PreAuthorize("hasAuthority('SUPER') or #id == T(com.hoka.bo.common.CurrentUser).id()")
    @Transactional
    public void replace(long id, byte[] uploaded) {
        required(id);
        userMapper.updateAvatar(id, normalize(uploaded));
    }

    @PreAuthorize("hasAuthority('SUPER') or #id == T(com.hoka.bo.common.CurrentUser).id()")
    @Transactional
    public void delete(long id) {
        required(id);
        userMapper.updateAvatar(id, null);
    }

    private void required(long id) {
        if (userMapper.findDetail(id) == null) {
            throw ApiException.notFound("USER_NOT_FOUND", "없는 사용자입니다: " + id);
        }
    }

    // 가운데를 정사각으로 잘라 SIZE로 줄이고 PNG로 다시 쓴다.
    // ponytail: EXIF 방향은 보지 않는다. 세로로 찍은 휴대폰 사진이 눕는 게 문제가 되면 그때 읽는다.
    private byte[] normalize(byte[] uploaded) {
        if (uploaded == null || uploaded.length == 0) {
            throw ApiException.badRequest("VALIDATION", "사진 파일이 비어 있습니다.");
        }
        try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(uploaded))) {
            BufferedImage source = read(stream);
            int side = Math.min(source.getWidth(), source.getHeight());
            BufferedImage square = source.getSubimage(
                    (source.getWidth() - side) / 2, (source.getHeight() - side) / 2, side, side);

            BufferedImage out = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_ARGB);
            Graphics2D canvas = out.createGraphics();
            canvas.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            canvas.drawImage(square, 0, 0, SIZE, SIZE, null);
            canvas.dispose();

            ByteArrayOutputStream png = new ByteArrayOutputStream();
            ImageIO.write(out, "png", png);
            return png.toByteArray();
        } catch (IOException e) {
            throw ApiException.badRequest("AVATAR_UNREADABLE", "사진을 읽지 못했습니다. 다른 파일로 올려 주세요.");
        }
    }

    private BufferedImage read(ImageInputStream stream) throws IOException {
        Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
        if (!readers.hasNext()) {
            throw ApiException.badRequest("AVATAR_NOT_IMAGE", "PNG·JPG·WebP 같은 이미지 파일만 올릴 수 있습니다.");
        }
        ImageReader reader = readers.next();
        try {
            reader.setInput(stream);
            // 헤더의 치수부터 본다. 디코드한 뒤에 재면 이미 메모리를 다 쓴 뒤다.
            if ((long) reader.getWidth(0) * reader.getHeight(0) > MAX_PIXELS) {
                throw ApiException.badRequest("AVATAR_TOO_LARGE", "사진이 너무 큽니다. 더 작은 이미지로 올려 주세요.");
            }
            return reader.read(0);
        } finally {
            reader.dispose();
        }
    }

}
