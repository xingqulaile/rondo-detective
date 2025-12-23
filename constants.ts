
export const AUDIO_URL = 'https://r2work.bohubs.com/audio/Turkish%20March%20Mozart%20-%20Rondo%20Alla%20Turca.mp3';

export type SectionType = 'A' | 'B' | 'C' | 'Coda';

export interface Section {
  type: SectionType;
  start: number;
  end: number;
  color: string;
}

// 严格按照用户提供的专业分析时间戳进行切割 (单位：秒)
export const PROFESSIONAL_STRUCTURE: Section[] = [
  { type: 'A', start: 0, end: 22, color: 'bg-yellow-500' },
  { type: 'B', start: 22, end: 45, color: 'bg-orange-500' },
  { type: 'C', start: 45, end: 68, color: 'bg-purple-500' },
  { type: 'B', start: 68, end: 88, color: 'bg-orange-500' },
  { type: 'A', start: 88, end: 110, color: 'bg-yellow-500' },
  { type: 'B', start: 110, end: 132, color: 'bg-orange-500' },
  { type: 'Coda', start: 132, end: 300, color: 'bg-red-600' } // 300为占位符，实际会根据duration计算
];

export const BUTTON_CONFIG: { type: SectionType, label: string, desc: string, color: string }[] = [
  { type: 'A', label: '这是 A 段', desc: '轻快/忧郁', color: 'bg-yellow-600' },
  { type: 'B', label: '这是 B 段', desc: '雄壮/进行曲', color: 'bg-orange-600' },
  { type: 'C', label: '这是 C 段', desc: '密集/流动', color: 'bg-purple-600' },
  { type: 'Coda', label: '这是 Coda', desc: '辉煌/尾声', color: 'bg-red-700' }
];
