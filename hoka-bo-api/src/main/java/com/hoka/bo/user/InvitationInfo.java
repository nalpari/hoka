package com.hoka.bo.user;

// 초대 링크를 연 사람에게 보여 줄 정보. 로그인 전이라 이것만 공개한다.
public record InvitationInfo(String email, String name) {
}
