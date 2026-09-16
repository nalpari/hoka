package com.hoka.bo.user;

// 메일 발송이 없어 초대 링크를 응답으로 돌려준다. 원문 토큰이 남는 곳은 여기뿐이다.
public record Invitation(long userId, String inviteUrl) {
}
