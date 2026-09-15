#!/usr/bin/env bash
# 배치 job 실행. 종료 코드는 java 프로세스의 것을 그대로 돌려준다.
#
#   run-job.sh <jobName> [targetDate]
#       targetDate(yyyy-MM-dd)를 생략하면 Asia/Seoul 기준 어제. GNU date가 필요하다(macOS는 날짜를 직접 넘긴다).
#   run-job.sh --recover <jobName> <targetDate>
#       비정상 종료로 실행 중 상태에 멈춘 실행을 FAILED로 표시한다. 그 프로세스가 죽은 걸 확인한 뒤에만 쓴다.
#       복구 뒤 첫 번째 형식으로 다시 실행하면 실패한 step부터 이어서 돈다.
#
# jar 위치는 HOKA_BATCH_JAR로 바꾼다. 기본값은 빌드 결과물(target/hoka-batch.jar).
set -euo pipefail

jar="${HOKA_BATCH_JAR:-$(dirname "$0")/../target/hoka-batch.jar}"

if [ "${1:-}" = "--recover" ]; then
  if [ $# -ne 3 ]; then
    echo "사용법: $0 --recover <jobName> <targetDate>" >&2
    exit 2
  fi
  exec java -jar "$jar" --spring.batch.job.enabled=false --recover="$2" "targetDate=$3"
fi

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
  echo "사용법: $0 <jobName> [targetDate]" >&2
  exit 2
fi
target_date="${2:-$(TZ=Asia/Seoul date -d yesterday +%F)}"
exec java -jar "$jar" --spring.batch.job.name="$1" "targetDate=$target_date"
