package com.hoka.batch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HokaBatchApplication {

    public static void main(String[] args) {
        // job 결과를 프로세스 종료 코드로 넘겨야 셸과 cron이 실패를 안다.
        System.exit(SpringApplication.exit(SpringApplication.run(HokaBatchApplication.class, args)));
    }

}
