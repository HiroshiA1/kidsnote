import type { Staff } from '@/components/AppLayout';

export const initialStaff: Staff[] = [
  { id: '1', firstName: '花子', lastName: '佐藤', role: '園長', email: 'sato@example.com', phone: '090-1111-1111', hireDate: new Date('2010-04-01'), qualifications: ['保育士', '幼稚園教諭一種'] },
  { id: '2', firstName: '太郎', lastName: '田中', role: '主任', classAssignment: 'さくら組', email: 'tanaka@example.com', phone: '090-2222-2222', hireDate: new Date('2015-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '3', firstName: '美咲', lastName: '鈴木', role: '担任', classAssignment: 'さくら組', email: 'suzuki@example.com', phone: '090-3333-3333', hireDate: new Date('2020-04-01'), qualifications: ['保育士'] },
  { id: '4', firstName: '健太', lastName: '山本', role: '担任', classAssignment: 'ひまわり組', email: 'yamamoto@example.com', phone: '090-4444-4444', hireDate: new Date('2021-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '5', firstName: '優子', lastName: '中村', role: '副担任', classAssignment: 'ひまわり組', email: 'nakamura@example.com', phone: '090-5555-5555', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '6', firstName: '和子', lastName: '小林', role: 'パート', email: 'kobayashi@example.com', hireDate: new Date('2023-04-01'), qualifications: ['保育士'] },
  { id: '7', firstName: '真理子', lastName: '高橋', role: '担任', classAssignment: 'たんぽぽ組', email: 'takahashi@example.com', phone: '090-7777-7777', hireDate: new Date('2018-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '8', firstName: '大輔', lastName: '渡辺', role: '担任', classAssignment: 'ひよこ組', email: 'watanabe@example.com', phone: '090-8888-8888', hireDate: new Date('2019-04-01'), qualifications: ['保育士'] },
  { id: '9', firstName: '恵子', lastName: '伊藤', role: '副担任', classAssignment: 'さくら組', email: 'ito@example.com', phone: '090-9999-9999', hireDate: new Date('2021-04-01'), qualifications: ['保育士'] },
  { id: '10', firstName: '裕介', lastName: '加藤', role: '担任', classAssignment: 'うさぎ組', email: 'kato@example.com', phone: '090-1010-1010', hireDate: new Date('2017-04-01'), qualifications: ['保育士', '幼稚園教諭一種'] },
  { id: '11', firstName: '千尋', lastName: '吉田', role: '副担任', classAssignment: 'たんぽぽ組', email: 'yoshida@example.com', phone: '090-1111-1100', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '12', firstName: '翔太', lastName: '松本', role: '担任', classAssignment: 'ゆり組', email: 'matsumoto@example.com', phone: '090-1212-1212', hireDate: new Date('2016-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '13', firstName: '美穂', lastName: '井上', role: '副担任', classAssignment: 'ゆり組', email: 'inoue@example.com', phone: '090-1313-1313', hireDate: new Date('2023-04-01'), qualifications: ['保育士'] },
  { id: '14', firstName: '直美', lastName: '木村', role: 'パート', email: 'kimura@example.com', phone: '090-1414-1414', hireDate: new Date('2024-04-01'), qualifications: ['保育士'] },
  { id: '15', firstName: '拓也', lastName: '林', role: '副担任', classAssignment: 'ひよこ組', email: 'hayashi@example.com', phone: '090-1515-1515', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '16', firstName: '由美', lastName: '清水', role: 'パート', email: 'shimizu@example.com', phone: '090-1616-1616', hireDate: new Date('2024-10-01'), qualifications: ['保育士'] },
];
