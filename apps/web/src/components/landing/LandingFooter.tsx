import Logo from "@/components/Logo";

const LandingFooter = () => (
  <footer style={{ background: "#f8f9fe", borderTop: "1.5px solid #ebebef" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <Logo size="sm" href="/" />
        <div className="flex flex-wrap gap-6">
          <a href="#" className="footer-link">
            개인정보처리방침
          </a>
          <a href="#" className="footer-link">
            이용약관
          </a>
        </div>
      </div>
      <div style={{ paddingTop: 12 }}>
        <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.7 }}>
          Portraq는 투자 정보 제공 서비스로, 투자 조언이나 추천을 제공하지
          않습니다. 모든 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야
          합니다.
          <br />
          CAGR·MDD는 백테스트 기반 참고값으로 실제 수익률과 다를 수 있으며, 원금
          손실의 위험이 있습니다.
        </p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          © 2026 Portraq. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
