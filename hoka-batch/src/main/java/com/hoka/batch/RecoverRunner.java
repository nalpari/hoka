package com.hoka.batch;

import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.converter.DefaultJobParametersConverter;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 프로세스가 비정상 종료돼 실행 중 상태로 남은 실행을 FAILED로 표시해, 같은 파라미터로 다시 실행할 수 있게 한다.
 * <p>
 * {@code --spring.batch.job.enabled=false --recover=<jobName> targetDate=<날짜>} 로 실행한다.
 * 그 프로세스가 정말 죽었는지는 실행하는 사람이 확인한다. 살아 있는 실행에 쓰면 같은 날짜를 두 프로세스가 처리한다.
 */
@Component
class RecoverRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RecoverRunner.class);

    private final JobRepository jobRepository;
    private final JobOperator jobOperator;

    RecoverRunner(JobRepository jobRepository, JobOperator jobOperator) {
        this.jobRepository = jobRepository;
        this.jobOperator = jobOperator;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!args.containsOption("recover")) {
            return;
        }
        String jobName = args.getOptionValues("recover").getFirst();
        // Boot의 JobLauncherApplicationRunner와 같은 방식으로 인자를 job 파라미터로 바꾼다.
        Properties properties = StringUtils.splitArrayElementsIntoProperties(
                args.getNonOptionArgs().toArray(String[]::new), "=");
        JobParameters parameters = new DefaultJobParametersConverter()
                .getJobParameters(properties != null ? properties : new Properties());

        JobExecution execution = jobRepository.getLastJobExecution(jobName, parameters);
        if (execution == null || !execution.getStatus().isRunning()) {
            throw new IllegalStateException("실행 중 상태로 남은 실행이 없습니다: " + jobName + " " + parameters);
        }
        JobExecution recovered = jobOperator.recover(execution);
        log.info("실행 {}을(를) {}(으)로 복구했습니다: {} {}", recovered.getId(), recovered.getStatus(), jobName, parameters);
    }

}
