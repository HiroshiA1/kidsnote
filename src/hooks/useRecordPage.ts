import { useMemo } from 'react';
import { useApp } from '@/components/AppLayout';
import { IntentType, InputMessage } from '@/types/intent';
import { sampleRecords } from '@/lib/sampleData';

interface UseRecordPageOptions {
  intentType: IntentType;
}

export function useRecordPage({ intentType }: UseRecordPageOptions) {
  const appContext = useApp();
  const { messages, confirmMessage, editMessage, cancelMessage, markForRecord } = appContext;

  const pendingMessages = useMemo(
    () => messages.filter(
      m => (m.status === 'processing' || m.status === 'confirmed') && m.result?.intent === intentType
    ),
    [messages, intentType]
  );

  const savedMessages = useMemo(
    () => [
      ...messages.filter(m => m.status === 'saved' && m.result?.intent === intentType),
      ...sampleRecords.filter(r => r.result?.intent === intentType),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [messages, intentType]
  );

  const groupByDate = useMemo(
    () => (items: InputMessage[]) =>
      items.reduce<Record<string, InputMessage[]>>((acc, m) => {
        const key = m.timestamp.toDateString();
        (acc[key] ||= []).push(m);
        return acc;
      }, {}),
    []
  );

  return {
    ...appContext,
    pendingMessages,
    savedMessages,
    groupByDate,
    confirmMessage,
    editMessage,
    cancelMessage,
    markForRecord,
  };
}
