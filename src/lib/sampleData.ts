import { InputMessage, GrowthData, IncidentData, HandoverData, ChildUpdateData } from '@/types/intent';

// 今日・昨日の日付をベースにした相対日付を生成
function todayAt(hours: number, minutes: number = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function yesterdayAt(hours: number, minutes: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export const sampleRecords: InputMessage[] = [
  // 成長記録（今日2件、昨日1件）
  {
    id: '1',
    content: 'Aくん、今日は初めて鉄棒で逆上がりができた',
    timestamp: todayAt(10, 30),
    status: 'saved',
    result: {
      intent: 'growth',
      data: {
        child_names: ['Aくん'],
        summary: '初めて鉄棒で逆上がりができた',
        tags: ['運動', '達成'],
      } as GrowthData,
    },
  },
  {
    id: '2',
    content: 'Bちゃん、絵を描くのがとても上手になった',
    timestamp: todayAt(11, 0),
    status: 'saved',
    result: {
      intent: 'growth',
      data: {
        child_names: ['Bちゃん'],
        summary: '絵を描くのがとても上手になった',
        tags: ['創作', '成長'],
      } as GrowthData,
    },
  },
  {
    id: '6',
    content: 'Fくん、友達におもちゃを貸してあげられた',
    timestamp: yesterdayAt(15, 0),
    status: 'saved',
    result: {
      intent: 'growth',
      data: {
        child_names: ['Fくん'],
        summary: '友達におもちゃを貸してあげられた',
        tags: ['社会性', '思いやり'],
      } as GrowthData,
    },
  },
  // ヒヤリハット（今日1件、昨日1件）
  {
    id: '3',
    content: '園庭の滑り台でCちゃんが膝を擦りむいた',
    timestamp: todayAt(14, 0),
    status: 'saved',
    result: {
      intent: 'incident',
      data: {
        location: '園庭・滑り台',
        cause: '転倒',
        severity: 'low',
        child_name: 'Cちゃん',
        description: '滑り台を滑った後、着地時にバランスを崩して膝を擦りむいた',
      } as IncidentData,
    },
  },
  {
    id: '7',
    content: 'Gくんが廊下で走って転びそうになった',
    timestamp: yesterdayAt(11, 30),
    status: 'saved',
    result: {
      intent: 'incident',
      data: {
        location: '廊下',
        cause: '走行',
        severity: 'low',
        child_name: 'Gくん',
        description: '廊下を走っていて曲がり角で他の園児とぶつかりそうになった',
      } as IncidentData,
    },
  },
  // 申し送り（今日2件）
  {
    id: '4',
    content: 'Dくんのお迎えは今日おばあちゃんになります',
    timestamp: todayAt(9, 0),
    status: 'saved',
    result: {
      intent: 'handover',
      data: {
        message: '本日のお迎えはおばあちゃんに変更',
        target: '担任・お迎え担当',
        urgent: false,
      } as HandoverData,
    },
  },
  {
    id: '8',
    content: 'Hちゃんは午後から早退予定です',
    timestamp: todayAt(8, 0),
    status: 'saved',
    result: {
      intent: 'handover',
      data: {
        message: '午後2時に早退予定（通院のため）',
        target: '担任',
        urgent: true,
      } as HandoverData,
    },
  },
  // 園児情報更新（今日1件、昨日なし→今日に変更）
  {
    id: '5',
    content: 'Eくん、卵アレルギー解除になりました',
    timestamp: todayAt(8, 30),
    status: 'saved',
    result: {
      intent: 'child_update',
      data: {
        child_name: 'Eくん',
        field: 'allergy',
        new_value: '卵アレルギー解除',
      } as ChildUpdateData,
    },
  },
  {
    id: '9',
    content: 'Iちゃんの緊急連絡先が変更になりました',
    timestamp: todayAt(9, 15),
    status: 'saved',
    result: {
      intent: 'child_update',
      data: {
        child_name: 'Iちゃん',
        field: 'characteristic',
        new_value: '緊急連絡先を母親の携帯に変更',
      } as ChildUpdateData,
    },
  },
];

export const getRecordsByIntent = (intent: string) =>
  sampleRecords.filter(r => r.result?.intent === intent);
