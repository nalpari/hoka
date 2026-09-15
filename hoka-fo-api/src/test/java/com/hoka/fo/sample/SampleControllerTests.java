package com.hoka.fo.sample;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

// 로컬 appdb에 실제로 접속한다. 테스트가 만든 행만 만들고 지운다.
@SpringBootTest
@AutoConfigureMockMvc
class SampleControllerTests {

    @Autowired
    MockMvc mvc;

    @Test
    void rejectsAnonymous() throws Exception {
        mvc.perform(get("/api/samples")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void rejectsBlankName() throws Exception {
        mvc.perform(post("/api/samples").contentType(APPLICATION_JSON).content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void crud() throws Exception {
        String created = mvc.perform(post("/api/samples").contentType(APPLICATION_JSON).content("{\"name\":\"crud-test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("crud-test"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();
        String url = "/api/samples/" + id;

        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("crud-test"));
        mvc.perform(get("/api/samples")).andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id == %d)]", id).exists());
        mvc.perform(put(url).contentType(APPLICATION_JSON).content("{\"name\":\"crud-test-updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("crud-test-updated"));
        mvc.perform(delete(url)).andExpect(status().isNoContent());
        mvc.perform(get(url)).andExpect(status().isNotFound());
        mvc.perform(delete(url)).andExpect(status().isNotFound());
    }

}
