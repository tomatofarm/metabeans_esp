# MetaBeans ESP REST API 엔드포인트 설계서 — 수정 이력

**원본 문서**: [MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md](MetaBeans_ESP_REST_API_엔드포인트_설계서__최신.md)

**버전**: v1.3  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-03-19  
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

---
