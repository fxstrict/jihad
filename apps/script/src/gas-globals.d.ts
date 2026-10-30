// تصريح أدنى لما يستخدمه الهيكل الآن. عند بدء منطق حقيقي: أضف @types/google-apps-script واحذف هذا الملف.
declare const ContentService: {
  createTextOutput(text: string): { setMimeType(m: unknown): unknown };
  MimeType: { JSON: unknown };
};
