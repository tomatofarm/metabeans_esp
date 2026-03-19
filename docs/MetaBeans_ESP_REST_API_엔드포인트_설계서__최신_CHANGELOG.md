# MetaBeans ESP REST API 엔드포인트 설계서 — 수정 이력

**원본 문서**: [MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md](MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md)

**버전**: v1.8  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-03-16  
**작성자**: 한재혁 (MetaBeans)  
**대상**: 고블린게임즈 개발팀, 내부 기획팀

---

> **v1.0 변경 이력 (2026-02-13)**:  
> - 초기 작성

> **v1.1 변경 이력 (2026-02-13)**:  
> - MQTT 260213 반영: fan_speed + fan_mode + damper_mode, 댐퍼/팬 자동제어 action 추가  
> - value 타입 int → number, config/config/ack 토픽 정의

> **v1.2 변경 이력 (2026-02-27)**:  
> - MQTT 260227_v2 반영: oilLevel float→int, ppSpark 0~9999, fanRunning/fanFreq/fanTargetPct/damperCtrl 신규  
> - status wifi 객체 추가, status_flags bit5 복합 판정

> **v1.3 변경 이력 (2026-03-19)**:  
> - 회원가입: HQ/Dealer에 사업자등록증 업로드(businessCertFile) 추가  
> - 2.0 사업자등록증 업로드 규격 신설: multipart/form-data, JPG/PNG/PDF, 최대 10MB, 제출 기한 7일

> **v1.4 변경 이력 (2026-03-19)**:  
> - HQ 가입: hqInfo에 zipCode, address, addressDetail, phone, email, contactName, contactPhone, contactEmail 추가  
> - Dealer 가입: location에 zipCode, address, addressDetail, phone, email, contactName, contactPhone, contactEmail 추가  
> - business: business.address 제거 (hqInfo/location으로 이관)

> **v1.5 변경 이력 (2026-03-19)**:  
> - HQ 가입: hqInfo.businessType 제거(선택). account.phone/email은 담당자 연락처와 동일 값 전달 안내

> **v1.6 변경 이력 (2026-03-19)**:  
> - HQ 가입: 회원가입 단계에서 담당 대리점 선택 제거, dealerId는 선택(예시 Body에서 제거)

> **v1.7 변경 이력 (2026-03-16)**:  
> - §2.0 사업자등록증: 적용 대상에 **`POST /registration/owner` 추가** (OWNER/HQ/DEALER 공통 규격으로 명시)  
> - §2.0: **multipart/form-data** 전제, **역할별 필수 여부** 표 추가 (OWNER `businessCertFile` **필수** + 400 가이드 / HQ·DEALER 선택)  
> - §2.0: 텍스트 필드 + 파일 동시 전송 시 **구현 패턴 A/B** 안내 (JSON 파트 vs 평탄화 폼)  
> - §2.1 점주 가입: 예시 Body를 **프론트/타입과 정합** (`business.address` 제거, `store` 필드·`dealerId` 루트·`marketingAgreed`, `businessCertFile` §2.0 참조)  
> - §2.1: **account.phone/email**을 매장 정보 단계 값과 맞추는 **비고** 추가

> **v1.8 변경 이력 (2026-03-16)**:  
> - §2.3 본사 직원(ADMIN) 가입: Body에 **`termsAgreed` / `marketingAgreed`** 반영, **필드 표** 추가  
> - §2.3: 가입 UI에서 **사번·부서 미수집** 명시 (승인 후 별도 등록 안내)

---
