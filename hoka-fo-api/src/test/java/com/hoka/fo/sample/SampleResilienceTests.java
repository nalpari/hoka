package com.hoka.fo.sample;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

// 매퍼를 목으로 바꿔 DB 장애를 흉내 낸다. DB에 접속하지 않는다.
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser
class SampleResilienceTests {

    @Autowired
    MockMvc mvc;

    @Autowired
    CircuitBreakerRegistry circuitBreakerRegistry;

    @MockitoBean
    SampleMapper sampleMapper;

    @BeforeEach
    void setUp() {
        circuitBreakerRegistry.circuitBreaker("sample").reset();
        when(sampleMapper.findById(1L)).thenThrow(new DataAccessResourceFailureException("db down"));
    }

    @Test
    void retriesThenReturns503() throws Exception {
        mvc.perform(get("/api/samples/1")).andExpect(status().isServiceUnavailable());

        verify(sampleMapper, times(3)).findById(1L);
    }

    @Test
    void opensCircuitAfterRepeatedFailures() throws Exception {
        // 요청당 3번 시도하므로 4번째 요청에서 10번째 실패가 쌓여 브레이커가 열린다.
        for (int i = 0; i < 4; i++) {
            mvc.perform(get("/api/samples/1")).andExpect(status().isServiceUnavailable());
        }
        assertThat(circuitBreakerRegistry.circuitBreaker("sample").getState()).isEqualTo(CircuitBreaker.State.OPEN);

        clearInvocations(sampleMapper);
        mvc.perform(get("/api/samples/1")).andExpect(status().isServiceUnavailable());

        verifyNoInteractions(sampleMapper);
    }

}
