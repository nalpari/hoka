package com.hoka.fo.sample;

import java.util.List;
import java.util.Optional;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/samples")
public class SampleController {

    private final SampleMapper sampleMapper;

    public SampleController(SampleMapper sampleMapper) {
        this.sampleMapper = sampleMapper;
    }

    @GetMapping
    public List<Sample> list() {
        return sampleMapper.findAll();
    }

    // Retry가 CircuitBreaker 바깥에서 돈다. fallback을 @CircuitBreaker에 달면 fallback이 던진 503을 Retry가 다시 재시도한다.
    @GetMapping("/{id}")
    @Retry(name = "sample", fallbackMethod = "getFallback")
    @CircuitBreaker(name = "sample")
    public ResponseEntity<Sample> get(@PathVariable long id) {
        return ResponseEntity.of(Optional.ofNullable(sampleMapper.findById(id)));
    }

    // DB 장애와 브레이커 차단만 503으로 바꾼다. 그 밖의 예외는 fallback에 맞지 않아 그대로 나간다.
    private ResponseEntity<Sample> getFallback(long id, DataAccessException e) {
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "sample unavailable", e);
    }

    private ResponseEntity<Sample> getFallback(long id, CallNotPermittedException e) {
        throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "sample unavailable", e);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sample create(@RequestBody SampleRequest request) {
        return sampleMapper.insert(request.validName());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Sample> update(@PathVariable long id, @RequestBody SampleRequest request) {
        return ResponseEntity.of(Optional.ofNullable(sampleMapper.update(id, request.validName())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return sampleMapper.delete(id) == 1 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    record SampleRequest(String name) {

        String validName() {
            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
            }
            return name;
        }

    }

}
