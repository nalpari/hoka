package com.hoka.bo.auth;

// refreshToken은 원문이다. 서버에는 해시만 남는다.
public record TokenPair(String accessToken, String refreshToken, long expiresInSeconds) {
}
