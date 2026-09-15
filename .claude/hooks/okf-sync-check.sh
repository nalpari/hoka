#!/usr/bin/env bash
# Stop hook: 프로젝트 파일이 바뀌었는데 okf/ 가 그대로면 Claude에게 매핑표 확인을 요구한다.
# 같은 변경 내용으로는 세션당 한 번만 알린다.
set -u

command -v jq >/dev/null 2>&1 || exit 0
input=$(cat)

# hook 때문에 이어진 응답이면 다시 막지 않는다.
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && exit 0

cwd=$(jq -r '.cwd // empty' <<<"$input")
session=$(jq -r '.session_id // "unknown"' <<<"$input")

# 워크트리에서는 CLAUDE_PROJECT_DIR 이 원래 루트를 가리키므로 cwd 기준으로 저장소를 찾는다.
root=$(git -C "${cwd:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

# okf 문서와 무관한 파일: next dev 가 다시 쓰는 AGENTS.md, 에이전트 지침, README
pathspec=(hoka-fo-front hoka-bo-front hoka-fo-api hoka-bo-api hoka-batch ':!*/AGENTS.md' ':!*/CLAUDE.md' ':!*/README.md')

changed=$(git -c core.quotepath=off status --porcelain -uall --no-renames -- "${pathspec[@]}" | cut -c4-)
[ -n "$changed" ] || exit 0
[ -z "$(git status --porcelain -uall -- okf)" ] || exit 0

# 변경 내용 지문: 추적 파일 diff + untracked 파일 경로·내용
base=$(git rev-parse -q --verify HEAD || echo 4b825dc642cb6eb9a060e54bf8d69288fbee4904)
fingerprint=$(
  {
    git diff "$base" --binary -- "${pathspec[@]}"
    git ls-files -o --exclude-standard -z -- "${pathspec[@]}" |
      while IFS= read -r -d '' f; do printf '%s ' "$f"; git hash-object -- "$f"; done
  } | git hash-object --stdin
)

state_dir="$(git rev-parse --absolute-git-dir)/okf-sync-check"
state="$state_dir/$session"
[ -f "$state" ] && [ "$(cat "$state")" = "$fingerprint" ] && exit 0
mkdir -p "$state_dir" && printf '%s' "$fingerprint" > "$state"

total=$(printf '%s\n' "$changed" | wc -l | tr -d ' ')
list=$(printf '%s\n' "$changed" | head -20 | sed 's/^/- /')
[ "$total" -gt 20 ] && list="$list
- … 외 $((total - 20))개"

reason="프로젝트 파일이 바뀌었는데 okf/ 는 그대로입니다. 끝내기 전에 CLAUDE.md의 \"코드를 바꾸면 같은 변경에서 번들도 고친다\" 표로 영향받는 okf 문서를 확인하세요. 고칠 문서가 있으면 고치고 적합성 검사를 돌리고, 틀려진 내용이 없으면 그렇다고 한 줄로 말하고 끝내세요.

바뀐 프로젝트 파일:
$list"

jq -n --arg r "$reason" '{decision: "block", reason: $r}'
