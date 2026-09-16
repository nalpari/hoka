package com.hoka.bo.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// 로그인 전에 부르는 경로. 토큰 자체가 자격이다.
@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final UserService userService;

    public InvitationController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{token}")
    public InvitationInfo find(@PathVariable String token) {
        return userService.findInvitation(token);
    }

    @PostMapping("/{token}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@PathVariable String token, @RequestBody AcceptRequest request) {
        userService.acceptInvite(token, request.password());
    }

    record AcceptRequest(String password) {
    }

}
