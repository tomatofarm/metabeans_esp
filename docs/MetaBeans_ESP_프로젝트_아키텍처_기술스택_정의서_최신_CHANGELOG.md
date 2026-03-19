# MetaBeans ESP 프로젝트 아키텍처·기술스택 정의서 — 수정 이력

**원본 문서**: [MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서_최신.md](MetaBeans_ESP_프로젝트_아키텍처_기술스택_정의서_최신.md)

**버전**: v1.1  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-03-18  
**작성자**: 한재혁 (MetaBeans)  
**대상**: 고블린게임즈 개발팀, 내부 기획팀

---

> **v1.1 변경 이력 (2026-02-13)**:  
> - MQTT Payload 규격 260213 반영: 댐퍼/시로코팬 자동 제어 명령 추가 (target=1 action 2,3 / target=2 action 4,5)  
> - sensor 메시지에 `fan_mode`, `damper_mode` 필드 추가  
> - config / config/ack 토픽 페이로드 완전 정의  
> - 자동 제어 동작 규칙 및 안전 오버라이드 규격 추가  
> - MQTT 토픽 구조 변경 협의 사항 (바이테리아 김나환 ↔ 메타빈스 이서현) 반영

> **v1.1 변경 이력 (2026-03-18)**:  
> - 폴더 구조: StoreTree.tsx 제거 (실제 구현은 Sidebar.tsx 내 매장-장비-컨트롤러 트리 포함)

> **v1.1 변경 이력 (2026-03-19)**:  
> - 컴포넌트: BusinessCertUpload.tsx 추가 (사업자등록증 업로드, HQ/Dealer 회원가입 사업자 정보 단계)
> - 회원가입: HQRegisterPage, DealerRegisterPage에 사업자등록증 업로드 UI 적용 (드래그앤드롭, JPG/PNG/PDF 최대 10MB)

---
