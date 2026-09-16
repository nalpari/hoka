package com.hoka.bo.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

// RFC 9457 응답에 code를 실어 같은 상태 코드의 이유를 프론트가 구분하게 한다.
public class ApiException extends ErrorResponseException {

    public ApiException(HttpStatus status, String code, String detail) {
        super(status, problem(status, code, detail), null);
    }

    public static ApiException unauthorized(String code, String detail) {
        return new ApiException(HttpStatus.UNAUTHORIZED, code, detail);
    }

    public static ApiException badRequest(String code, String detail) {
        return new ApiException(HttpStatus.BAD_REQUEST, code, detail);
    }

    public static ApiException notFound(String code, String detail) {
        return new ApiException(HttpStatus.NOT_FOUND, code, detail);
    }

    public static ApiException conflict(String code, String detail) {
        return new ApiException(HttpStatus.CONFLICT, code, detail);
    }

    public String getCode() {
        return (String) getBody().getProperties().get("code");
    }

    private static ProblemDetail problem(HttpStatus status, String code, String detail) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, detail);
        body.setProperty("code", code);
        return body;
    }

}
