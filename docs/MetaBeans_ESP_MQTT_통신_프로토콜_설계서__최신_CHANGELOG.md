# MetaBeans ESP MQTT 통신 프로토콜 설계서 — 수정 이력

**원본 문서**: [MetaBeans_ESP_MQTT_통신_프로토콜_설계서__최신.md](MetaBeans_ESP_MQTT_통신_프로토콜_설계서__최신.md)

**버전**: v2.1  
**작성일**: 2026-02-13  
**최종 수정일**: 2026-02-27  
**작성자**: 한재혁 (MetaBeans)  
**대상**: 고블린게임즈 개발팀, 내부 기획팀

---

> **v2.0 변경 이력 (2026-02-13)**:  
> - 초기 작성

> **v2.1 변경 이력 (2026-02-27)**:  
> - MQTT Payload 규격 260227_v2 반영  
> - oil_level float→int (0=정상, 1=만수)  
> - pp_spark 범위 0-99 → 0-9999  
> - fan_running, fan_freq, fan_target_pct, damper_ctrl 신규 필드  
> - status 토픽 wifi 객체 (ssid/rssi/ip/mac/channel) 추가  
> - status_flags bit5 복합 판정 (RS-485 통신 정상 AND Fault Trip 없음)

---
