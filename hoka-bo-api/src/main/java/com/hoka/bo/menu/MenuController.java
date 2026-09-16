package com.hoka.bo.menu;

import java.util.List;

import com.hoka.bo.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menus")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<Menu> list() {
        return menuService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Menu create(@RequestBody MenuRequest request) {
        request.validateForCreate();
        return menuService.create(request.toMenu(request.code()));
    }

    @PutMapping("/{code}")
    public Menu update(@PathVariable String code, @RequestBody MenuRequest request) {
        request.validateName();
        return menuService.update(code, request.toMenu(code));
    }

    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String code) {
        menuService.delete(code);
    }

    /** 같은 그룹 안에서 한 칸 위/아래로 옮긴다. 그룹을 바꾸는 일은 update가 한다. */
    @PutMapping("/{code}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void move(@PathVariable String code, @RequestBody MoveRequest request) {
        menuService.move(code, request.isUp());
    }

    record MoveRequest(String direction) {

        boolean isUp() {
            if (!"up".equals(direction) && !"down".equals(direction)) {
                throw ApiException.badRequest("VALIDATION", "방향은 up 또는 down이어야 합니다.");
            }
            return "up".equals(direction);
        }

    }

    record MenuRequest(String code, String parentCode, String name, String path, String icon, String description,
            boolean visible, boolean useCreate, boolean useRead, boolean useUpdate, boolean useDelete,
            String exclusiveRoleCode) {

        void validateForCreate() {
            if (code == null || !code.matches("[A-Z][A-Z0-9_]{1,39}")) {
                throw ApiException.badRequest("VALIDATION", "메뉴 코드는 대문자·숫자·밑줄로 2~40자여야 합니다.");
            }
            validateName();
        }

        void validateName() {
            if (name == null || name.isBlank()) {
                throw ApiException.badRequest("VALIDATION", "메뉴명을 입력해 주세요.");
            }
        }

        // sortOrder는 서버가 정한다(생성은 맨 뒤, 수정은 그대로).
        Menu toMenu(String code) {
            return new Menu(code, parentCode, name.trim(), path, icon, description, 0, visible,
                    useCreate, useRead, useUpdate, useDelete, exclusiveRoleCode);
        }

    }

}
