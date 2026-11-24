import { PresetIdea } from '../types/reel';

export interface LocalizedPresetIdea extends PresetIdea {
  language: 'français' | 'arabe' | 'anglais';
}

export const PRESET_IDEAS: LocalizedPresetIdea[] = [
  // French presets
  {
    category: 'Productivité',
    title: 'La règle des 2 minutes le matin',
    prompt: 'Pourquoi 90% des gens ruinent leur journée dès les 10 premières minutes et la technique de 2 minutes pour avoir une concentration laser.',
    tone: 'viral',
    language: 'français',
  },
  {
    category: 'Finance & Business',
    title: 'L\'erreur d\'épargne fatale',
    prompt: 'Pourquoi laisser son argent dormir sur un compte bancaire classique vous fait perdre 8% de pouvoir d\'achat par an sans que vous le remarquiez.',
    tone: 'éducatif',
    language: 'français',
  },
  {
    category: 'Psychologie & Mindset',
    title: 'L\'effet de halo sur Facebook',
    prompt: 'Comment les 3 premières secondes d\'une rencontre ou d\'une vidéo déclenchent une décision inconsciente dans le cerveau humain.',
    tone: 'mystérieux',
    language: 'français',
  },
  {
    category: 'Santé & Forme',
    title: 'Arrêtez le café à jeun',
    prompt: 'Pourquoi boire son café immédiatement au réveil sabote votre cortisol et l\'astuce simple à faire avant pour tripler votre énergie.',
    tone: 'viral',
    language: 'français',
  },
  {
    category: 'Astuces Tech & IA',
    title: 'Automatiser ses posts en 20s',
    prompt: 'Comment les créateurs de contenu publient 5 réels par jour sans jamais passer plus de 15 minutes devant leur écran grâce à l\'IA.',
    tone: 'viral',
    language: 'français',
  },

  // Arabic presets (أفكار مميزة باللغة العربية)
  {
    category: 'إنتاجية',
    title: 'قاعدة الدقيقتين في الصباح',
    prompt: 'لماذا يدمر 90% من الناس يومهم في أول 10 دقائق بعد الاستيقاظ والتقنية البسيطة التي تجعلك في قمة التركيز طوال اليوم.',
    tone: 'viral',
    language: 'arabe',
  },
  {
    category: 'مال وأعمال',
    title: 'الخطأ المالي القاتل',
    prompt: 'لماذا ترك أموالك في الحساب البنكي العادي يجعلك تخسر القوة الشرائية سنوياً وما هو البديل الذكي في 20 ثانية.',
    tone: 'éducatif',
    language: 'arabe',
  },
  {
    category: 'علم النفس والتأثير',
    title: 'سر أول 3 ثوانٍ في ريلز فيسبوك',
    prompt: 'كيف تجعل المشاهد يتوقف عن التمرير فوراً ويشاهد الفيديو حتى الثانية الأخيرة باستخدام خدعة بصرية نفسية مجربة.',
    tone: 'mystérieux',
    language: 'arabe',
  },
  {
    category: 'صحة ولياقة',
    title: 'توقف عن شرب القهوة على الريق',
    prompt: 'لماذا شرب القهوة فور الاستيقاظ يرفع هرمون التوتر ويقلل طاقتك ظهراً والبديل الصحي البسيط الذي يضاعف نشاطك.',
    tone: 'viral',
    language: 'arabe',
  },
  {
    category: 'ذكاء اصطناعي وتكنولوجيا',
    title: 'صناعة 5 ريلز في 15 دقيقة',
    prompt: 'كيف يستخدم صناع المحتوى الذكاء الاصطناعي لكتابة وتصميم فيديوهات قصيرة في دقائق والانتشار السريع على فيسبوك.',
    tone: 'viral',
    language: 'arabe',
  },
];
