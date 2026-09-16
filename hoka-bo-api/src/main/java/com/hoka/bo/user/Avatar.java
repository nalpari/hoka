package com.hoka.bo.user;

// 매퍼가 byte[]를 그대로 반환하면 MyBatis가 "여러 행"으로 보고 배열을 만들려다 실패한다.
// 한 겹 감싸면 컬럼 하나짜리 단일 행이 된다.
public record Avatar(byte[] png) {
}
