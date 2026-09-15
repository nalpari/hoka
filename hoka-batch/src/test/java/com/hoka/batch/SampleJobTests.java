package com.hoka.batch;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.JobInstance;
import org.springframework.batch.core.job.parameters.InvalidJobParametersException;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.launch.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.infrastructure.item.ExecutionContext;
import org.springframework.batch.test.JobOperatorTestUtils;
import org.springframework.batch.test.context.SpringBatchTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

// 테스트마다 targetDate를 달리 써서 메타 테이블 상태가 서로 섞이지 않게 한다.
@SpringBootTest(properties = { "spring.batch.job.enabled=false", "spring.sql.init.mode=always" })
@SpringBatchTest
@Testcontainers
class SampleJobTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine");

    @Autowired
    JobOperatorTestUtils jobOperatorTestUtils;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    RecoverRunner recoverRunner;

    @Test
    void countsSampleRowsWithinKstDay() throws Exception {
        JobExecution execution = jobOperatorTestUtils.startJob(targetDate("2026-09-14"));

        assertThat(execution.getStatus()).isEqualTo(BatchStatus.COMPLETED);
        assertThat(execution.getStepExecutions().iterator().next().getExecutionContext().getLong("count"))
                .isEqualTo(2);
    }

    @Test
    void rejectsMissingTargetDate() {
        assertThatThrownBy(() -> jobOperatorTestUtils.startJob(new JobParameters()))
                .isInstanceOf(InvalidJobParametersException.class);
    }

    @Test
    void rejectsRerunOfCompletedDate() throws Exception {
        jobOperatorTestUtils.startJob(targetDate("2026-09-13"));

        assertThatThrownBy(() -> jobOperatorTestUtils.startJob(targetDate("2026-09-13")))
                .isInstanceOf(JobInstanceAlreadyCompleteException.class);
    }

    @Test
    void recoversStuckExecutionSoItCanRunAgain() throws Exception {
        JobParameters parameters = targetDate("2026-09-12");
        // kill -9 로 죽은 프로세스가 남긴 상태를 흉내 낸다.
        JobInstance instance = jobRepository.createJobInstance("sampleJob", parameters);
        JobExecution stuck = jobRepository.createJobExecution(instance, parameters, new ExecutionContext());
        stuck.setStatus(BatchStatus.STARTED);
        jobRepository.update(stuck);
        assertThatThrownBy(() -> jobOperatorTestUtils.startJob(parameters))
                .isInstanceOf(JobExecutionAlreadyRunningException.class);

        recoverRunner.run(new DefaultApplicationArguments("--recover=sampleJob", "targetDate=2026-09-12"));

        assertThat(jobOperatorTestUtils.startJob(parameters).getStatus()).isEqualTo(BatchStatus.COMPLETED);
    }

    private static JobParameters targetDate(String value) {
        return new JobParametersBuilder().addString("targetDate", value).toJobParameters();
    }

}
