package com.hoka.bo.menu;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MenuService {

    private final MenuMapper menuMapper;

    public MenuService(MenuMapper menuMapper) {
        this.menuMapper = menuMapper;
    }

    // 권한 격자의 행. 그룹과 메뉴가 한 목록에 들어 있고 정렬은 트리 순서다.
    @PreAuthorize("hasAnyAuthority('SUPER', 'SYS_ROLES:R')")
    public List<Menu> findAll() {
        return menuMapper.findAll();
    }

}
