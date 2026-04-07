import { GrowthCategoryId } from '@/types/growth';

export interface GrowthItem {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export interface GrowthCategory {
  id: GrowthCategoryId;
  label: string;
  icon: string;
  color: string;
  items: GrowthItem[];
}

export const growthCategories: GrowthCategory[] = [
  {
    id: 'ten_figures',
    label: '幼児期の終わりまでに育ってほしい10の姿',
    icon: '🌟',
    color: '#6366f1',
    items: [
      { id: 'tf_health', label: '健康な心と体', shortLabel: '健康', description: '自ら健康で安全な生活をつくり出す' },
      { id: 'tf_independence', label: '自立心', shortLabel: '自立心', description: '自分の力で行動し、やり遂げようとする' },
      { id: 'tf_cooperation', label: '協同性', shortLabel: '協同性', description: '友達と関わり、共通の目的の実現に向けて考え工夫する' },
      { id: 'tf_morality', label: '道徳性・規範意識の芽生え', shortLabel: '道徳性', description: 'してよいことや悪いことがわかり、考えて行動する' },
      { id: 'tf_social', label: '社会生活との関わり', shortLabel: '社会性', description: '社会との関わりの中で生活する力を育む' },
      { id: 'tf_thinking', label: '思考力の芽生え', shortLabel: '思考力', description: '物事の性質や仕組みを考え、気づく' },
      { id: 'tf_nature', label: '自然との関わり・生命尊重', shortLabel: '自然', description: '自然に触れ、感動し、大切にする心をもつ' },
      { id: 'tf_math', label: '数量や図形等への関心', shortLabel: '数量', description: '数量・図形・標識に関心をもち、生活に取り入れる' },
      { id: 'tf_language', label: '言葉による伝え合い', shortLabel: '言葉', description: '言葉で伝え合い、言葉に対する感覚を豊かにする' },
      { id: 'tf_expression', label: '豊かな感性と表現', shortLabel: '感性', description: '感じたこと考えたことを自分なりに表現する' },
    ],
  },
  {
    id: 'daily_life',
    label: '生活面',
    icon: '🏠',
    color: '#10b981',
    items: [
      { id: 'dl_dressing', label: '衣服の着脱', shortLabel: '着脱', description: '自分で衣服を着たり脱いだりできる' },
      { id: 'dl_eating', label: '食事', shortLabel: '食事', description: '食事のマナーや好き嫌いなく食べる力' },
      { id: 'dl_toilet', label: '排泄', shortLabel: '排泄', description: 'トイレに関する自立度' },
      { id: 'dl_hygiene', label: '手洗い・うがい', shortLabel: '衛生', description: '手洗いやうがいの習慣' },
      { id: 'dl_cleanup', label: '片付け', shortLabel: '片付け', description: '使った物を片付ける習慣' },
      { id: 'dl_belongings', label: '持ち物管理', shortLabel: '持ち物', description: '自分の持ち物を管理する力' },
    ],
  },
  {
    id: 'non_cognitive',
    label: '主体性や非認知能力',
    icon: '💪',
    color: '#f59e0b',
    items: [
      { id: 'nc_agency', label: '主体性', shortLabel: '主体性', description: '自ら考え行動する力' },
      { id: 'nc_perseverance', label: '忍耐力', shortLabel: '忍耐力', description: '困難に耐え粘り強く取り組む力' },
      { id: 'nc_emotional', label: '感情制御', shortLabel: '感情制御', description: '自分の感情をコントロールする力' },
      { id: 'nc_teamwork', label: '協調性', shortLabel: '協調性', description: '周りの人と協力して取り組む力' },
      { id: 'nc_curiosity', label: '探究心', shortLabel: '探究心', description: '物事への興味関心を深め追求する力' },
      { id: 'nc_resilience', label: 'レジリエンス', shortLabel: '回復力', description: '失敗や困難から立ち直る力' },
      { id: 'nc_creativity', label: '創造性', shortLabel: '創造性', description: '新しいアイデアを生み出す力' },
    ],
  },
];

export function getCategoryById(id: GrowthCategoryId): GrowthCategory {
  return growthCategories.find(c => c.id === id)!;
}

export function getAllItemIds(): string[] {
  return growthCategories.flatMap(c => c.items.map(i => i.id));
}

export function getItemById(itemId: string): GrowthItem | undefined {
  for (const cat of growthCategories) {
    const item = cat.items.find(i => i.id === itemId);
    if (item) return item;
  }
  return undefined;
}

export function getCategoryForItem(itemId: string): GrowthCategory | undefined {
  return growthCategories.find(c => c.items.some(i => i.id === itemId));
}
