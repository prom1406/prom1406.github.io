/* سجل الشركات (العملاء) — كل شركة لها ملف Google Sheets وخادم Apps Script خاص بها، والموقع واحد.
   رابط الشركة لفريقها:  https://prom1406.github.io/hajj-1447/?c=<الرمز>
   لإضافة شركة: أضف سطراً بالرمز (حروف إنجليزية صغيرة وأرقام و -)، والاسم الظاهر، ورابط خادمها (…/exec).
   logo (اختياري): مسار صورة مربعة داخل المستودع، مثل tenants/alnoor.png
   legacy: للشركة الأولى فقط — تبقى بياناتها المحفوظة في المتصفحات كما كانت قبل تعدد الشركات.
   ملاحظة: هذا الملف عام (أسماء الشركات ورموزها وروابط خوادمها ظاهرة)، أما بيانات الحجاج فتبقى في ملف كل شركة ولا تمر من هنا. */
window.HAJJ_CONFIG = {
  tenants: {
    main: { name: '', webapp: "https://script.google.com/macros/s/AKfycbyVjqP_BW7pzvtdQbLC63KU7kmOvxAh8UrQVbffdLbOp7-BkyXX9ZX3QVRWnp8oi5tukw/exec", legacy: true }
  }
};
