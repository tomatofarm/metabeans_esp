# 백엔드 요청 — `GET /system/approvals` 응답에 HQ 브랜드명 추가

> 작성일: 2026-05-15

---

## 1. 배경

본사(HQ) 회원가입 시 **브랜드명**(`brandName`)과 **법인명**(`corporationName`)을 모두 입력합니다.
가입 승인 대기 목록(`GET /system/approvals`)에서 관리자가 어느 브랜드의 가입 요청인지 바로 파악하려면
**브랜드명이 가장 크게** 표시되어야 합니다.

현재 응답의 `businessInfo.businessName`에는 법인명만 포함되어 있고 브랜드명은 누락되어 있습니다.

---

## 2. 요청 사항

`GET /system/approvals` 응답 항목에 **`brandName` 필드 추가**:

| 필드 | 타입 | 대상 역할 | 출처 |
|------|------|----------|------|
| `brandName` | `string \| null` | HQ | `hq_profiles.hq_name` |

### 응답 예시 (HQ 항목)

```json
{
  "userId": 13,
  "loginId": "new_hq1",
  "name": "송본사",
  "role": "HQ",
  "email": "song.hq@franchise.com",
  "phone": "010-8888-4567",
  "brandName": "맛나",
  "businessInfo": {
    "businessName": "맛나프랜차이즈(주)",
    "businessNumber": "456-78-90123"
  },
  "createdAt": "2026-02-13T16:45:00Z"
}
```

- DEALER / ADMIN / OWNER는 `brandName: null` 또는 필드 누락 허용.

---

## 3. 프론트엔드 반영 현황

- `PendingApproval` 타입에 `brandName?: string` 추가 완료
- `fetchPendingApprovals` 매핑에 `brandName` 추가 완료
- 승인 카드 UI:
  - HQ이고 `brandName` 있으면 → 카드 제목(큰 글씨)에 브랜드명 표시
  - 서브텍스트에 `법인명: {businessName}` 표시
  - 나머지 역할은 기존과 동일 (`businessName || name`)
