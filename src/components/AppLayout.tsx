'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SmartInput, Attachment } from './SmartInput';
import { IntentResult, InputMessage, AddChildData, AddStaffData } from '@/types/intent';
import { Rule, RuleChatMessage } from '@/types/rule';
import { classifyInputAction } from '@/app/actions/classify';
import { ChildWithGrowth, initialChildren, inferGradeFromClass, splitName, createBirthDate } from '@/lib/childrenStore';
import { sampleRules } from '@/lib/sampleRules';

// 職員型
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  role: '園長' | '主任' | '担任' | '副担任' | 'パート';
  classAssignment?: string;
  email?: string;
  phone?: string;
  hireDate: Date;
  qualifications: string[];
}

// 初期職員データ
const initialStaff: Staff[] = [
  { id: '1', firstName: '花子', lastName: '佐藤', role: '園長', email: 'sato@example.com', phone: '090-1111-1111', hireDate: new Date('2010-04-01'), qualifications: ['保育士', '幼稚園教諭一種'] },
  { id: '2', firstName: '太郎', lastName: '田中', role: '主任', classAssignment: 'さくら組', email: 'tanaka@example.com', phone: '090-2222-2222', hireDate: new Date('2015-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '3', firstName: '美咲', lastName: '鈴木', role: '担任', classAssignment: 'さくら組', email: 'suzuki@example.com', phone: '090-3333-3333', hireDate: new Date('2020-04-01'), qualifications: ['保育士'] },
  { id: '4', firstName: '健太', lastName: '山本', role: '担任', classAssignment: 'ひまわり組', email: 'yamamoto@example.com', phone: '090-4444-4444', hireDate: new Date('2021-04-01'), qualifications: ['保育士', '幼稚園教諭二種'] },
  { id: '5', firstName: '優子', lastName: '中村', role: '副担任', classAssignment: 'ひまわり組', email: 'nakamura@example.com', phone: '090-5555-5555', hireDate: new Date('2022-04-01'), qualifications: ['保育士'] },
  { id: '6', firstName: '和子', lastName: '小林', role: 'パート', email: 'kobayashi@example.com', hireDate: new Date('2023-04-01'), qualifications: ['保育士'] },
];

interface AppContextType {
  messages: InputMessage[];
  addMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  confirmMessage: (id: string) => void;
  editMessage: (id: string, newIntent: IntentResult['intent']) => void;
  cancelMessage: (id: string) => void;
  markForRecord: (id: string) => void;
  isProcessing: boolean;
  sidebarCollapsed: boolean;
  children: ChildWithGrowth[];
  staff: Staff[];
  addChild: (child: ChildWithGrowth) => void;
  addStaff: (staff: Staff) => void;
  rules: Rule[];
  addRule: (rule: Rule) => void;
  updateRule: (rule: Rule) => void;
  deleteRule: (id: string) => void;
  ruleChatMessages: RuleChatMessage[];
  addRuleChatMessage: (message: RuleChatMessage) => void;
  clearRuleChat: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppLayout');
  }
  return context;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<InputMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [childrenData, setChildrenData] = useState<ChildWithGrowth[]>(initialChildren);
  const [staffData, setStaffData] = useState<Staff[]>(initialStaff);
  const [rules, setRules] = useState<Rule[]>(sampleRules);
  const [ruleChatMessages, setRuleChatMessages] = useState<RuleChatMessage[]>([]);

  const addChildToStore = (child: ChildWithGrowth) => {
    setChildrenData(prev => [...prev, child]);
  };

  const addStaffToStore = (staff: Staff) => {
    setStaffData(prev => [...prev, staff]);
  };

  const addRule = (rule: Rule) => {
    setRules(prev => [...prev, rule]);
  };

  const updateRule = (rule: Rule) => {
    setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const addRuleChatMessage = (message: RuleChatMessage) => {
    setRuleChatMessages(prev => [...prev, message]);
  };

  const clearRuleChat = () => {
    setRuleChatMessages([]);
  };

  const addMessage = async (text: string, attachments?: Attachment[]) => {
    const newMessage: InputMessage = {
      id: crypto.randomUUID(),
      content: text,
      timestamp: new Date(),
      status: 'processing',
    };

    setMessages(prev => [newMessage, ...prev]);
    setIsProcessing(true);

    const result = await classifyInputAction(text);

    setMessages(prev =>
      prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, result, status: 'confirmed' }
          : msg
      )
    );
    setIsProcessing(false);
  };

  const confirmMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);

    if (message?.result) {
      // 園児追加の場合
      if (message.result.intent === 'add_child') {
        const data = message.result.data as AddChildData;
        const rawData = message.result.data as unknown as Record<string, unknown>;
        const name = data.name || (rawData.child_name as string) || '不明';
        const nameParts = splitName(name);
        const newChild: ChildWithGrowth = {
          id: crypto.randomUUID(),
          firstName: nameParts.firstName || nameParts.firstNameKanji || '',
          lastName: nameParts.lastName || nameParts.lastNameKanji || '',
          firstNameKanji: nameParts.firstNameKanji,
          lastNameKanji: nameParts.lastNameKanji,
          birthDate: createBirthDate(data.birth_date),
          classId: data.class_name?.replace('組', '') || 'unknown',
          className: data.class_name || '未定',
          grade: data.class_name ? inferGradeFromClass(data.class_name) : '年中',
          gender: data.gender || 'other',
          allergies: data.allergies || [],
          characteristics: [],
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          growthLevels: [
            { domain: 'health', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'relationships', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'environment', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'language', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
            { domain: 'expression', level: 1, lastUpdated: new Date(), linkedEpisodeIds: [] },
          ],
        };
        addChildToStore(newChild);
      }

      // 職員追加の場合
      if (message.result.intent === 'add_staff') {
        const data = message.result.data as AddStaffData;
        const rawData = message.result.data as unknown as Record<string, unknown>;
        const name = data.name || (rawData.staff_name as string) || '不明';
        const nameParts = splitName(name);
        const newStaff: Staff = {
          id: crypto.randomUUID(),
          firstName: nameParts.firstName || nameParts.firstNameKanji || '',
          lastName: nameParts.lastName || nameParts.lastNameKanji || '',
          role: (data.role as Staff['role']) || '担任',
          classAssignment: data.class_name,
          phone: data.contact,
          hireDate: new Date(),
          qualifications: ['保育士'],
        };
        addStaffToStore(newStaff);
      }
    }

    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, status: 'saved' } : msg
      )
    );
  };

  const editMessage = (messageId: string, newIntent: IntentResult['intent']) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId || !msg.result) return msg;
        return {
          ...msg,
          result: { ...msg.result, intent: newIntent },
        };
      })
    );
  };

  const cancelMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const markForRecord = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, isMarkedForRecord: !msg.isMarkedForRecord }
          : msg
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        messages,
        addMessage,
        confirmMessage,
        editMessage,
        cancelMessage,
        markForRecord,
        isProcessing,
        sidebarCollapsed,
        children: childrenData,
        staff: staffData,
        addChild: addChildToStore,
        addStaff: addStaffToStore,
        rules,
        addRule,
        updateRule,
        deleteRule,
        ruleChatMessages,
        addRuleChatMessage,
        clearRuleChat,
      }}
    >
      <div className="flex min-h-screen bg-background">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={`flex-1 pb-32 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {children}
        </main>
        <SmartInput onSubmit={addMessage} isProcessing={isProcessing} sidebarCollapsed={sidebarCollapsed} />
      </div>
    </AppContext.Provider>
  );
}
