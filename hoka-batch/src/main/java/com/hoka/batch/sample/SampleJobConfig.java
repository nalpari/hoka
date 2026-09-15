package com.hoka.batch.sample;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.job.parameters.InvalidJobParametersException;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * targetDate 하루(Asia/Seoul) 동안 생성된 sample 건수를 센다. 파이프라인 확인용 읽기 전용 job.
 */
@Configuration
public class SampleJobConfig {

    private static final Logger log = LoggerFactory.getLogger(SampleJobConfig.class);
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    @Bean
    Job sampleJob(JobRepository jobRepository, Step sampleStep) {
        return new JobBuilder("sampleJob", jobRepository)
                .validator(SampleJobConfig::validateTargetDate)
                .start(sampleStep)
                .build();
    }

    @Bean
    Step sampleStep(JobRepository jobRepository, PlatformTransactionManager transactionManager,
            SampleMapper sampleMapper) {
        return new StepBuilder("sampleStep", jobRepository)
                .tasklet((contribution, chunkContext) -> {
                    var stepExecution = contribution.getStepExecution();
                    LocalDate targetDate = LocalDate.parse(stepExecution.getJobParameters().getString("targetDate"));
                    long count = sampleMapper.countCreatedBetween(
                            targetDate.atStartOfDay(ZONE).toOffsetDateTime(),
                            targetDate.plusDays(1).atStartOfDay(ZONE).toOffsetDateTime());
                    stepExecution.getExecutionContext().putLong("count", count);
                    log.info("{} sample 건수: {}", targetDate, count);
                    return RepeatStatus.FINISHED;
                }, transactionManager)
                .build();
    }

    private static void validateTargetDate(JobParameters parameters) throws InvalidJobParametersException {
        String targetDate = parameters.getString("targetDate");
        if (targetDate == null) {
            throw new InvalidJobParametersException("targetDate 파라미터가 필요합니다 (예: targetDate=2026-09-14)");
        }
        try {
            LocalDate.parse(targetDate);
        } catch (DateTimeParseException e) {
            throw new InvalidJobParametersException("targetDate는 yyyy-MM-dd 형식이어야 합니다: " + targetDate);
        }
    }

}
