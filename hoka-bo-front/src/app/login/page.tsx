import Image from "next/image";

import { Brandmark, Icon } from "@/components/Icon";

import { LoginForm } from "./login-form";

// 시안 ref/design/login.html 기준. OTP 안내와 비밀번호 찾기는 해당 기능이 없어 뺐다.
export default function LoginPage() {
  return (
    <div className="auth">
      <div className="auth__form">
        <div className="flex flex--between" style={{ marginBottom: "var(--s-7)" }}>
          <span className="flex gap-2">
            <Brandmark />
            <b className="wordmark">HOKA</b>
            <span className="rail__tag" style={{ marginLeft: 2 }}>
              백오피스
            </span>
          </span>
        </div>

        <h1 className="t-display">브랜드스토어 운영을 한곳에서</h1>
        <p className="muted mt-3" style={{ maxWidth: "44ch", fontSize: 16 }}>
          주문과 출고, 재고와 사이즈, 프로모션과 정산까지. 호카코리아 운영팀의 하루가 여기서 시작됩니다.
        </p>

        <LoginForm />

        <hr className="hr" style={{ margin: "var(--s-6) 0" }} />

        {/* 셀프 처리가 되는 기능이 아직 없어 안내만 남기고 링크는 두지 않는다. */}
        <div className="col gap-3">
          <span className="t-h4">계정이 아직 없으신가요?</span>
          <ul className="stack auth__paths">
            <li>
              <span className="queue__icon is-accent">
                <Icon name="mail" size={15} />
              </span>
              <span className="cellstack">
                <span className="primary">초대 메일로 계정 만들기</span>
                <small>백오피스 계정은 권한 관리자가 발급합니다. 받은 초대 링크는 24시간 안에 열어 주세요.</small>
              </span>
            </li>
            <li>
              <span className="queue__icon">
                <Icon name="shield" size={15} />
              </span>
              <span className="cellstack">
                <span className="primary">접근 권한 요청</span>
                <small>계정은 있지만 필요한 메뉴가 보이지 않을 때. 소속 팀의 권한 관리자에게 요청하세요.</small>
              </span>
            </li>
            <li>
              <span className="queue__icon">
                <Icon name="unlock" size={15} />
              </span>
              <span className="cellstack">
                <span className="primary">잠긴 계정 풀기</span>
                <small>비밀번호를 5회 틀렸거나 90일 동안 접속하지 않은 계정입니다. 권한 관리자가 풀어 줍니다.</small>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="auth__art">
        <Image
          src="/login-hero.webp"
          alt="새벽 한강 러닝 코스에서 러닝화 끈을 묶는 러너"
          fill
          priority
          sizes="50vw"
          style={{ objectFit: "cover", objectPosition: "50% 40%" }}
        />
        <div className="auth__quote">
          <p>주문은 밤에도 들어옵니다. 아침에 열면 오늘 나갈 것부터 보여야 합니다.</p>
          <p>출고 마감, 사이즈 재고, 미답변 문의를 한 범위 안에서 봅니다.</p>
        </div>
      </div>
    </div>
  );
}
