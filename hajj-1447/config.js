/* سجل الشركات (العملاء) — كل شركة لها ملف Google Sheets وخادم Apps Script خاص بها، والموقع واحد.
   رابط الشركة لفريقها:  https://prom1406.github.io/hajj-1447/?c=<الرمز>
   legacy: للشركة الأولى فقط — تبقى بياناتها المحفوظة في المتصفحات كما كانت قبل تعدد الشركات.
   ملاحظة: هذا الملف عام. لذلك شركات العملاء لا تُكتب هنا: تُضاف من «لوحة حالة الشركات» (status.html، بدخول المالك)
   وتُحفظ في «سجل الشركات» على خادم المزوّد (registry أدناه)، والموقع يسأله عن الشركة برمزها فقط. */
window.HAJJ_CONFIG = {
  // للدليل setup.html: رقم واتساب يستقبل طلبات التفعيل (بالصيغة الدولية بلا +، مثل 9665xxxxxxxx)، ورابط «إنشاء نسخة» لقالب جاهز إن وُجد
  support: { whatsapp: '966569090301', template: '' },
  // خادم المزوّد (خادم شركتك الأولى): يحفظ سجل الشركات، ومنه يدخل المالك إلى لوحة حالة الشركات
  registry: "https://script.google.com/macros/s/AKfycbyVjqP_BW7pzvtdQbLC63KU7kmOvxAh8UrQVbffdLbOp7-BkyXX9ZX3QVRWnp8oi5tukw/exec",
  tenants: {
    main: { name: '', webapp: "https://script.google.com/macros/s/AKfycbyVjqP_BW7pzvtdQbLC63KU7kmOvxAh8UrQVbffdLbOp7-BkyXX9ZX3QVRWnp8oi5tukw/exec", legacy: true },
    // نسخة العرض للعملاء والمستثمرين: بيانات وهمية داخل المتصفح (demo.js)، لا خادم ولا بيانات حقيقية
    demo: { name: 'منظومة تحركات الحجاج — عرض', webapp: "https://script.google.com/macros/s/DEMO-hajj1447/exec", demo: true },
    // مؤقتاً هنا حتى يعمل سجل الشركات على خادم المزوّد، ثم تُنقل إلى لوحة حالة الشركات
    anjum: { name: 'أنجم', webapp: "https://script.google.com/macros/s/AKfycbyTXgSBC40XoMh3NLb2V_KfZKSPWFXKybsFSDefolSYsKacpkLp_4w9kxFbEfPnZHVQ/exec", logo: 'tenants/anjum.png' }
  }
};
