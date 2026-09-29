export const ar = {
  common: {
    validationFailed: "فشل التحقق من البيانات",
    notFound: "العنصر غير موجود",
    serverError: "حدث خطأ ما",
    unauthorized: "غير مصرح لك بالوصول",
    forbidden: "ليس لديك صلاحية للوصول إلى هذا المورد",
    internalServerError: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا.",
  },
  auth: {
    emailAlreadyExists: "البريد الإلكتروني مستخدم بالفعل",
    signupSuccess: "تم إنشاء الحساب بنجاح",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    signinSuccess: "تم تسجيل الدخول بنجاح",
    logoutSuccess: "تم تسجيل الخروج بنجاح",
  },
  collection: {
    created: "تم إنشاء المجموعة بنجاح",
    createFailed: "فشل إنشاء المجموعة",
    updated: "تم تحديث المجموعة بنجاح",
    updateFailed: "فشل تحديث المجموعة",
    notFound: "المجموعة غير موجودة",
  },
} as const;
