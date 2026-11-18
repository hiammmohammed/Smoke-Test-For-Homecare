# Phlebotex Smoke Suite

اختبارات سريعة (حوالي 10 دقايق) تتشغل أول ما يتنزل Build جديد على الـ Staging.

## التشغيل لأول مرة
```
npm install
npm run install-browsers
copy .env.example .env      (على Mac/Linux: cp .env.example .env)
```
افتحي `.env` واملي `E2E_ADMIN_EMAIL` و `E2E_ADMIN_PASSWORD`. **الملف ده ما يترفعش ولا يتبعت لحد.**

## كل مرة
```
npm run smoke           # تشغيل عادي
npm run smoke:headed    # تشوفي المتصفح وهو شغال
npm run smoke:ui        # واجهة تفاعلية للتشخيص
npm run report          # تقرير HTML بعد التشغيل (فيه Screenshots وVideo للي فشل)
```
تشغيل ملف واحد: `npx playwright test tests/03-tags.smoke.spec.ts`

## بيغطي إيه
| الملف | الاختبار |
|-------|----------|
| auth.setup.ts | تسجيل الدخول مرة واحدة (بيحفظ الـ Session) |
| 01-pages | 23 صفحة أساسية بتفتح من غير 5xx أو Crash |
| 02-patients | Quick Registration، المريض يظهر في القايمة بالـ ID والتليفون، بعدين بيتمسح. وفورم Full Registration فيه Special Needs |
| 03-tags | Dialog التاج فيه VIP Alert وVIP Data Masking. وAssign Patient Tags: Specific لازم تاج واحد على الأقل، وCancel ما بيغيّرش حاجة |
| 04-dispatch | Dispatch Panel وفلاتره، وAdd New Request، وتابات App Requests |

## مش مغطى (يدوي أو من مستودع المنتج)
- دورة الطلب كاملة (إنشاء، Assign، الحالات): موجودة في `e2e/tests/requests/request-lifecycle.spec.ts` في مشروع الـ Dashboard وبتحتاج `E2E_ALLOW_MESSAGES=true`.
- الـ VIP Alert، تطبيق المريض، تطبيق الأخصائي، الإشعارات، الـ Export، الـ Zones: يدوي.

## قواعد مهمة
- **متسجليش دخول جوه أي Test.** تسجيل الدخول بيقفل الـ Sessions التانية لنفس الحساب.
- أي حاجة بتتعمل اسمها بيبدأ بـ `E2e-` وبتتمسح في آخر الـ Test.
- لو Test فشل: افتحي `npm run report`، وشوفي الـ Trace قبل ما تفتحي Bug.
# Smoke-Test-For-Homecare
