import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  X,
  Minimize2,
  Compass,
} from 'lucide-react';
import { useBuddy } from '../context/BuddyContext';
import { BuddyAvatar } from './BuddyAvatar';
import { BuddyMessage, HelpCard } from './DesignSystem';
import {
  TaskStepIllustration,
  StoryEditorialIllustration,
  RoutinePeriodIllustration,
  GrowthTopicIllustration,
} from './BuddyIllustrations';
import { voiceService } from '../services/voiceService';
import { normalizeBuddyCompanionText } from '../services/buddyCompanionLanguage';
import { ChatMessage } from '../types/domain';

interface CompanionQuickCard {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  intent: string;
  bgClass: string;
  visualPreview: React.ReactNode;
}

// Minimal browser SpeechRecognition interface for strict TypeScript safety
interface BrowserSpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous?: boolean;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Shared Inner Companion Experience (used inside FloatingBuddyChat sheet/dialog and standalone BuddyChatView)
 * - Header: "Buddy · Bạn đồng hành", compact status pill, accessible sound/reset/minimize/close controls that never overlap at 360–390px.
 * - Mode 1 (Companion Stage): Buddy avatar, 1 concise speech bubble, primary circular microphone button, and up to 4 quick suggestion cards (no duplicate example pill row).
 * - Mode 2 (Conversation Mode): Independently scrollable message stream, embedded action cards, and compact navigation chips.
 * - Always-accessible bottom composer bar with real SpeechRecognition abort/cleanup lifecycle.
 */
export const BuddyChatView: React.FC<{
  isOverlaySheet?: boolean;
  onCloseSheet?: () => void;
  onMinimizeSheet?: () => void;
}> = ({ isOverlaySheet = false, onCloseSheet, onMinimizeSheet }) => {
  const {
    data,
    geminiConfigured,
    voiceState,
    starSummary,
    sendChatMessage,
    isChatLoading,
    clearChatHistory,
    openSubView,
    navigateTab,
    updateVoicePreference,
    activeTaskStepContext,
    setSelectedJourneyTopicId,
    closeBuddyChat,
  } = useBuddy();

  const hasChildMessages = data.chatHistory.some((m) => m.role === 'child');
  const [forceCompanionStage, setForceCompanionStage] = useState(false);

  const isConversationMode = hasChildMessages && !forceCompanionStage;

  const [inputText, setInputText] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Real SpeechRecognition instance & monotonic session token to cancel active mic and block stale callbacks
  const recognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null);
  const micSessionTokenRef = useRef(0);

  const stopAndCleanupMicSession = useCallback(() => {
    micSessionTokenRef.current += 1;
    const activeRec = recognitionRef.current;
    if (activeRec) {
      recognitionRef.current = null;
      try {
        activeRec.onresult = null;
        activeRec.onerror = null;
        activeRec.onend = null;
        activeRec.abort();
      } catch {
        // Ignore abort error
      }
      try {
        activeRec.stop();
      } catch {
        // Ignore stop error
      }
    }
    setIsListeningMic(false);
  }, []);

  // Cleanup active SpeechRecognition session when component unmounts
  useEffect(() => {
    return () => {
      stopAndCleanupMicSession();
    };
  }, [stopAndCleanupMicSession]);

  useEffect(() => {
    if (isConversationMode) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data.chatHistory.length, isChatLoading, isConversationMode]);

  const isSpeaking =
    voiceState.status === 'playing' || voiceState.status === 'speaking';

  // Companion State: idle | listening | thinking | speaking
  const companionState: 'idle' | 'listening' | 'thinking' | 'speaking' =
    isListeningMic
      ? 'listening'
      : isChatLoading
      ? 'thinking'
      : isSpeaking
      ? 'speaking'
      : 'idle';

  const lastBuddyMsgObj =
    [...data.chatHistory].reverse().find((m) => m.role === 'buddy') || null;
  const rawLastBuddyMessage =
    lastBuddyMsgObj?.text ||
    `Chào ${data.profile.displayName}! Mình cùng trò chuyện nhé! Bạn chạm vào Micro hoặc chọn 1 thẻ bên dưới nào!`;
  const lastBuddyMessage = normalizeBuddyCompanionText(
    rawLastBuddyMessage,
    data.profile.displayName
  );

  // Contextual current step info if child is inside Task Guide
  const currentStepInfo = React.useMemo(() => {
    if (!activeTaskStepContext) return null;
    const t = data.tasks.find((item) => item.id === activeTaskStepContext.taskId);
    const st = t?.steps[activeTaskStepContext.stepIndex];
    if (!t || !st) return null;
    return { task: t, step: st, stepNumber: activeTaskStepContext.stepIndex + 1 };
  }, [activeTaskStepContext, data.tasks]);

  // Maximum 4 Quick Suggestion Cards (peer companion "mình - bạn" wording)
  const QUICK_SUGGESTION_CARDS: CompanionQuickCard[] = [
    {
      id: 'quick-curious',
      title: 'Hỏi điều thú vị',
      subtitle: 'Khám phá thế giới quanh mình',
      prompt: 'Buddy ơi, vì sao sau cơn mưa lại có cầu vồng nhiều màu sắc vậy?',
      intent: 'greeting_or_chat',
      bgClass: 'bg-[#EAF3FF] hover:bg-[#d8e9ff]',
      visualPreview: (
        <div className="w-11 h-10 sm:w-12 sm:h-11 shrink-0">
          <StoryEditorialIllustration
            type="hat-giong"
            className="w-full h-full rounded-[14px] p-1"
          />
        </div>
      ),
    },
    {
      id: 'quick-today',
      title: 'Việc hôm nay',
      subtitle: 'Cùng làm hoạt động trong ngày',
      prompt: 'Buddy ơi, mình cùng bắt đầu việc hôm nay nhé!',
      intent: 'today_activities',
      bgClass: 'bg-[#DDF5E8] hover:bg-[#ccebd9]',
      visualPreview: (
        <div className="w-11 h-10 sm:w-12 sm:h-11 shrink-0">
          <TaskStepIllustration
            illustrationKey="pack-books"
            className="w-full h-full rounded-[14px] p-1"
          />
        </div>
      ),
    },
    {
      id: 'quick-story',
      title: 'Nghe kể chuyện',
      subtitle: 'Podcast truyện ấm áp mỗi tối',
      prompt: 'Buddy ơi, mình muốn nghe kể chuyện tối nay!',
      intent: 'tell_story',
      bgClass: 'bg-[#EDE7FF] hover:bg-[#e0d6ff]',
      visualPreview: (
        <div className="w-11 h-10 sm:w-12 sm:h-11 shrink-0">
          <StoryEditorialIllustration
            type="bau-troi-dem"
            className="w-full h-full rounded-[14px] p-1"
          />
        </div>
      ),
    },
    {
      id: 'quick-stars',
      title: 'Xem sao & quà',
      subtitle: `${starSummary.monthlyStars} ngôi sao tháng này`,
      prompt: 'Buddy ơi, mình cùng xem ngôi sao và quà nhé!',
      intent: 'view_stars_rewards',
      bgClass: 'bg-[#FFF0C9] hover:bg-[#ffe5a3]',
      visualPreview: (
        <div className="w-11 h-10 sm:w-12 sm:h-11 shrink-0">
          <RoutinePeriodIllustration
            period="morning"
            className="w-full h-full rounded-[14px]"
          />
        </div>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isChatLoading) return;
    stopAndCleanupMicSession();
    const text = inputText;
    setInputText('');
    setForceCompanionStage(false);
    await sendChatMessage(text);
  };

  const handleQuickCardClick = async (card: CompanionQuickCard) => {
    if (isChatLoading) return;
    stopAndCleanupMicSession();
    setForceCompanionStage(false);
    await sendChatMessage(card.prompt, card.intent);
  };

  const handleChipIntentClick = async (prompt: string, intent: string) => {
    if (isChatLoading) return;
    stopAndCleanupMicSession();
    setForceCompanionStage(false);
    await sendChatMessage(prompt, intent);
  };

  const handleResetConversation = async () => {
    stopAndCleanupMicSession();
    voiceService.stop();
    await clearChatHistory();
    setForceCompanionStage(false);
  };

  // Browser Speech Recognition with real cancellation on second tap and stale callback protection
  const handleToggleMic = () => {
    // Second tap while listening: truly abort and cleanup the active SpeechRecognition session
    if (isListeningMic || recognitionRef.current) {
      stopAndCleanupMicSession();
      return;
    }

    if (!data.parentSettings.allowVoiceInput) {
      setMicNote('Ba mẹ đang tắt tính năng nói bằng micro trong cài đặt Phụ huynh.');
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognitionInstance })
        .SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMicNote(
        'Trình duyệt này chưa hỗ trợ thu âm trực tiếp. Bạn hãy chạm vào 1 trong 4 thẻ gợi ý hoặc gõ chữ bên dưới nhé!'
      );
      return;
    }

    try {
      // Stop any active Buddy speech before opening microphone
      voiceService.cancel();

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      micSessionTokenRef.current += 1;
      const mySessionToken = micSessionTokenRef.current;
      recognitionRef.current = recognition;

      setIsListeningMic(true);
      setMicNote(null);

      recognition.onresult = async (event) => {
        if (micSessionTokenRef.current !== mySessionToken) return;
        recognitionRef.current = null;
        setIsListeningMic(false);
        const transcript = event?.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setForceCompanionStage(false);
          await sendChatMessage(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (micSessionTokenRef.current !== mySessionToken) return;
        recognitionRef.current = null;
        setIsListeningMic(false);
        // Do not show an error banner if the user intentionally aborted the session
        if (event?.error === 'aborted') return;
        setMicNote('Mình chưa nghe rõ lời bạn nói. Bạn thử bấm nói lại hoặc chọn thẻ gợi ý nhé!');
      };

      recognition.onend = () => {
        if (micSessionTokenRef.current !== mySessionToken) return;
        recognitionRef.current = null;
        setIsListeningMic(false);
      };

      recognition.start();
    } catch {
      stopAndCleanupMicSession();
      setMicNote('Chưa bật được micro. Bạn hãy chọn thẻ gợi ý hoặc gõ chữ bên dưới nhé!');
    }
  };

  const renderEmbeddedActionCard = (msg: ChatMessage) => {
    const action = msg.actionCard;
    if (!action || action.intent === 'greeting_or_chat') return null;

    if (action.intent === 'need_help') {
      const targetTask =
        data.tasks.find((t) => t.id === (action.helpTopicTaskId || action.taskId)) ||
        data.tasks[0];
      const stepIdx =
        activeTaskStepContext && activeTaskStepContext.taskId === targetTask.id
          ? activeTaskStepContext.stepIndex
          : 0;
      const targetStep = targetTask.steps[stepIdx] || targetTask.steps[0];
      const safeExplanation = normalizeBuddyCompanionText(
        targetStep?.simpleExplanation ||
          'Bạn chỉ cần nhìn theo từng bức tranh nhỏ và làm từ từ từng bước một cùng mình là xong ngay!',
        data.profile.displayName
      );

      return (
        <div className="pt-1">
          <HelpCard
            stepTitle={`${targetTask.title} – ${targetStep?.actionTitle || 'Hướng dẫn'}`}
            simpleExplanation={safeExplanation}
            illustrationKey={targetStep?.illustrationKey || targetTask.coverIllustration}
            onListenHelp={() =>
              voiceService.speak(safeExplanation, data.voicePreference, 'guide')
            }
            onDismissOrAction={() => {
              stopAndCleanupMicSession();
              openSubView({ type: 'guide-task', taskId: targetTask.id }, true);
              closeBuddyChat();
            }}
            actionButtonLabel={`Mở thẻ hình hướng dẫn: ${targetTask.title} →`}
          />
        </div>
      );
    }

    if (action.intent === 'start_task') {
      const targetTask =
        data.tasks.find((t) => t.id === action.taskId) || data.tasks[0];
      return (
        <div
          onClick={() => {
            stopAndCleanupMicSession();
            openSubView({ type: 'guide-task', taskId: targetTask.id }, true);
            closeBuddyChat();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              stopAndCleanupMicSession();
              openSubView({ type: 'guide-task', taskId: targetTask.id }, true);
              closeBuddyChat();
            }
          }}
          className="rounded-[22px] bg-white border-2 border-[#3978F6]/25 p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
            <TaskStepIllustration
              illustrationKey={targetTask.coverIllustration}
              className="w-full h-full rounded-[16px] p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-kids font-extrabold text-[#3978F6] bg-[#EAF3FF] px-2.5 py-0.5 rounded-[12px]">
              Hướng dẫn thẻ hình · +{targetTask.starReward} ★
            </span>
            <h4 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate mt-1">
              {targetTask.title}
            </h4>
            <p className="text-xs text-[#23324D]/70 truncate">
              {targetTask.steps.length} bước tranh minh họa dễ hiểu
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[18px] bg-[#3978F6] text-white flex items-center justify-center shrink-0">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      );
    }

    if (action.intent === 'open_journey') {
      const matchedTopic =
        (data.growthTopics || []).find((t) => t.id === action.topicId) ||
        (data.growthTopics || []).find((t) => t.isCurrentFocus) ||
        data.growthTopics?.[0];

      return (
        <button
          type="button"
          onClick={() => {
            stopAndCleanupMicSession();
            if (matchedTopic) {
              setSelectedJourneyTopicId(matchedTopic.id);
            }
            navigateTab('journey', true);
            closeBuddyChat();
          }}
          className="w-full rounded-[22px] bg-[#EDE7FF]/85 hover:bg-[#e2d8ff] border border-indigo-300/60 p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <GrowthTopicIllustration
              slug={matchedTopic?.slug || 'gratitude'}
              className="w-14 h-14 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[11px] font-kids font-extrabold text-indigo-900">
                Bản đồ Hành trình
              </span>
              <h4 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate">
                {action.actionLabel}
              </h4>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-indigo-900 shrink-0" />
        </button>
      );
    }

    if (action.intent === 'tell_story') {
      const story =
        data.stories.find((s) => s.id === action.storyId) || data.stories[0];
      return (
        <div
          onClick={() => {
            stopAndCleanupMicSession();
            openSubView({ type: 'story-list' }, true);
            closeBuddyChat();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              stopAndCleanupMicSession();
              openSubView({ type: 'story-list' }, true);
              closeBuddyChat();
            }
          }}
          className="rounded-[22px] bg-[#EDE7FF]/85 border border-indigo-300/60 p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
            <StoryEditorialIllustration
              type={story.illustrationType}
              className="w-full h-full rounded-[16px] p-1.5"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-kids font-extrabold text-indigo-800 bg-white px-2.5 py-0.5 rounded-[12px]">
              Podcast Kể chuyện
            </span>
            <h4 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate mt-1">
              {action.actionLabel}
            </h4>
            <p className="text-xs text-[#23324D]/75 truncate">
              Chạm để mở trình phát truyện cùng mình
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[18px] bg-[#3978F6] text-white flex items-center justify-center shrink-0">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      );
    }

    if (action.intent === 'today_activities') {
      return (
        <button
          type="button"
          onClick={() => {
            stopAndCleanupMicSession();
            navigateTab('activities', true);
            closeBuddyChat();
          }}
          className="w-full rounded-[22px] bg-[#DDF5E8] hover:bg-[#ccebd9] p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 shrink-0">
              <TaskStepIllustration
                illustrationKey="schedule-check"
                className="w-full h-full rounded-[14px] p-1"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-kids font-extrabold text-emerald-900">
                Hoạt động trong ngày
              </span>
              <h4 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate">
                {action.actionLabel}
              </h4>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-900 shrink-0" />
        </button>
      );
    }

    if (action.intent === 'view_stars_rewards') {
      return (
        <button
          type="button"
          onClick={() => {
            stopAndCleanupMicSession();
            openSubView({ type: 'stars-detail' }, true);
            closeBuddyChat();
          }}
          className="w-full rounded-[22px] bg-[#FFF0C9] hover:bg-[#ffe5a3] p-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 shrink-0">
              <RoutinePeriodIllustration
                period="morning"
                className="w-full h-full rounded-[14px]"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-kids font-extrabold text-amber-900">
                {starSummary.monthlyStars} ngôi sao tháng này
              </span>
              <h4 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate">
                {action.actionLabel}
              </h4>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-900 shrink-0" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* 1. Compact Header: "Buddy · Bạn đồng hành" + Non-overlapping accessible controls on 360–390px */}
      <header className="flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BuddyAvatar
            size="xs"
            isSpeaking={isSpeaking}
            mood={companionState === 'thinking' ? 'thinking' : 'happy'}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-kids text-sm sm:text-base font-extrabold text-[#23324D] truncate leading-tight">
              Buddy · Bạn đồng hành
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  companionState === 'listening'
                    ? 'bg-rose-500 animate-ping'
                    : companionState === 'speaking'
                    ? 'bg-[#3978F6] animate-pulse'
                    : geminiConfigured
                    ? 'bg-emerald-500'
                    : 'bg-[#3978F6]'
                }`}
              />
              <span className="text-[11px] font-kids font-bold text-[#23324D]/70 truncate">
                {companionState === 'listening'
                  ? 'Đang nghe bạn nói...'
                  : companionState === 'thinking'
                  ? 'Mình đang suy nghĩ...'
                  : companionState === 'speaking'
                  ? 'Mình đang nói...'
                  : `Giọng ${data.voicePreference.gender === 'male' ? 'Nam' : 'Nữ'} · Sẵn sàng`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasChildMessages && (
            <button
              type="button"
              onClick={() => setForceCompanionStage((prev) => !prev)}
              aria-label={isConversationMode ? 'Chuyển sang màn hình Buddy' : 'Xem lịch sử trò chuyện'}
              title={isConversationMode ? 'Màn hình Buddy' : 'Xem hội thoại'}
              className="min-h-[36px] px-2.5 py-1 rounded-[18px] bg-white hover:bg-[#EAF3FF] border border-[#23324D]/10 text-[11px] font-kids font-bold text-[#3978F6] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden min-[380px]:inline">
                {isConversationMode ? 'Buddy' : 'Tin nhắn'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              updateVoicePreference({ muted: !data.voicePreference.muted })
            }
            aria-label={data.voicePreference.muted ? 'Bật âm thanh giọng đọc' : 'Tắt âm thanh giọng đọc'}
            title={data.voicePreference.muted ? 'Bật giọng đọc' : 'Tắt giọng đọc'}
            className="w-9 h-9 rounded-[18px] bg-white hover:bg-[#EAF3FF] border border-[#23324D]/10 flex items-center justify-center text-[#23324D] transition-colors cursor-pointer shrink-0"
          >
            {data.voicePreference.muted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#3978F6]" />
            )}
          </button>

          {hasChildMessages && (
            <button
              type="button"
              onClick={handleResetConversation}
              aria-label="Làm mới cuộc trò chuyện"
              title="Làm mới cuộc trò chuyện"
              className="w-9 h-9 rounded-[18px] bg-white hover:bg-[#EAF3FF] border border-[#23324D]/10 flex items-center justify-center text-[#23324D]/75 hover:text-[#3978F6] transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {isOverlaySheet && onMinimizeSheet && (
            <button
              type="button"
              onClick={() => {
                stopAndCleanupMicSession();
                onMinimizeSheet();
              }}
              aria-label="Thu nhỏ cửa sổ Buddy"
              title="Thu nhỏ Buddy"
              className="w-9 h-9 rounded-[18px] bg-white hover:bg-[#EAF3FF] border border-[#23324D]/10 flex items-center justify-center text-[#23324D]/75 hover:text-[#3978F6] transition-colors cursor-pointer shrink-0"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {isOverlaySheet && onCloseSheet && (
            <button
              type="button"
              onClick={() => {
                stopAndCleanupMicSession();
                onCloseSheet();
              }}
              aria-label="Đóng cửa sổ Buddy"
              title="Đóng cửa sổ Buddy"
              className="w-9 h-9 rounded-[18px] bg-[#EAF3FF] hover:bg-[#3978F6] text-[#3978F6] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Contextual Banner when child is inside a Task Guide step */}
      {currentStepInfo && (
        <div className="rounded-[18px] bg-[#FFF0C9]/90 border border-amber-300 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-kids font-extrabold text-amber-900 uppercase block truncate">
              Đang xem Bước {currentStepInfo.stepNumber} · {currentStepInfo.task.title}
            </span>
            <p className="font-kids font-bold text-xs text-[#23324D] truncate">
              {currentStepInfo.step.actionTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              handleChipIntentClick('Mình chưa hiểu bước này', 'need_help')
            }
            className="shrink-0 px-3 py-1.5 rounded-[18px] bg-white hover:bg-[#3978F6] text-[#23324D] hover:text-white font-kids font-extrabold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Giải thích bước này
          </button>
        </div>
      )}

      {/* MAIN SCROLLABLE REGION (Companion Stage OR Conversation Stream) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
        {!isConversationMode ? (
          /* MODE 1: MINIMAL COMPANION STAGE (Avatar + 1 Short Speech Bubble + Primary Mic + 4 Quick Cards) */
          <>
            <section className="rounded-[26px] bg-gradient-to-b from-[#EAF3FF] via-[#F2F7FF] to-white border border-[#3978F6]/15 p-3.5 sm:p-4 text-center shadow-[0_8px_24px_rgba(57,120,246,0.08)] flex flex-col items-center">
              {/* Centered 3D Buddy Robot */}
              <div className="my-0.5">
                <BuddyAvatar
                  size="xl"
                  isSpeaking={isSpeaking}
                  mood={companionState === 'thinking' ? 'thinking' : 'happy'}
                />
              </div>

              {/* Single Concise Speech Bubble */}
              <div className="mt-2 w-full rounded-[20px] bg-white border border-[#3978F6]/15 px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-2.5 text-left">
                <p className="font-kids text-xs sm:text-sm font-bold text-[#23324D] leading-snug line-clamp-3 break-words">
                  “{lastBuddyMessage}”
                </p>
                <button
                  type="button"
                  onClick={() =>
                    voiceService.speak(lastBuddyMessage, data.voicePreference, 'chat')
                  }
                  aria-label="Nghe lời Buddy"
                  title="Nghe Buddy nói"
                  className="w-9 h-9 rounded-[18px] bg-[#EAF3FF] hover:bg-[#3978F6] text-[#3978F6] hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Primary CTA: Intentional Circular Microphone Button */}
              <div className="mt-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_8px_24px_rgba(57,120,246,0.3)] active:scale-95 ${
                    isListeningMic
                      ? 'bg-rose-500 text-white ring-6 ring-rose-500/20 animate-pulse'
                      : 'bg-[#3978F6] hover:bg-[#2964DF] text-white ring-6 ring-[#3978F6]/12'
                  }`}
                  aria-label={
                    isListeningMic
                      ? 'Bấm để huỷ thu âm micro'
                      : 'Bấm để nói chuyện với Buddy'
                  }
                >
                  {isListeningMic ? (
                    <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </button>
                <p className="mt-1.5 font-kids font-extrabold text-xs text-[#23324D]/80">
                  {isListeningMic
                    ? 'Đang nghe bạn... Bấm lần nữa để huỷ'
                    : 'Chạm Micro để nói cùng mình'}
                </p>
              </div>
            </section>

            {/* 4 Quick Suggestion Cards (2x2 Grid - No duplicate voice examples row) */}
            <section aria-label="Lựa chọn nhanh cùng Buddy">
              <div className="grid grid-cols-2 gap-2">
                {QUICK_SUGGESTION_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isChatLoading}
                    onClick={() => handleQuickCardClick(card)}
                    className={`text-left rounded-[18px] ${card.bgClass} p-2.5 sm:p-3 transition-all shadow-2xs hover:shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 min-w-0`}
                  >
                    {card.visualPreview}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-kids text-xs sm:text-sm font-extrabold text-[#23324D] leading-tight truncate">
                        {card.title}
                      </h3>
                      <p className="text-[10px] font-semibold text-[#23324D]/70 mt-0.5 truncate">
                        {card.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* MODE 2: CONVERSATION STREAM & COMPACT NAVIGATION CHIPS */
          <div className="space-y-2.5">
            <div className="rounded-[22px] bg-white border border-[#23324D]/8 p-3 sm:p-3.5 min-h-[210px] max-h-[340px] overflow-y-auto space-y-3 shadow-2xs">
              {data.chatHistory.map((msg) => {
                if (msg.role === 'buddy') {
                  return (
                    <div key={msg.id} className="space-y-2">
                      <BuddyMessage
                        text={msg.text}
                        voicePreference={data.voicePreference}
                        context="chat"
                      />
                      {renderEmbeddedActionCard(msg)}
                    </div>
                  );
                }

                // Child's own message: kept 100% verbatim
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[84%] rounded-[20px] rounded-tr-md bg-[#3978F6] text-white px-3.5 py-2.5 shadow-2xs">
                      <p className="font-kids font-bold text-sm sm:text-base leading-relaxed break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="rounded-[18px] bg-[#EAF3FF]/75 p-3 flex items-center gap-2.5 text-xs text-[#23324D] font-kids font-bold">
                  <Sparkles className="w-4 h-4 text-[#3978F6] animate-spin shrink-0" />
                  <span>Mình đang tìm câu trả lời và thẻ hướng dẫn cho bạn...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Compact Navigation Chips in Conversation Mode */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                disabled={isChatLoading}
                onClick={() => handleChipIntentClick('Mình chưa hiểu bước này', 'need_help')}
                className="min-h-[34px] px-3 py-1 rounded-[18px] bg-[#FFF0C9] hover:bg-[#ffe5a3] text-[#23324D] font-kids font-extrabold text-xs whitespace-nowrap inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Mình chưa hiểu</span>
              </button>
              <button
                type="button"
                disabled={isChatLoading}
                onClick={() =>
                  handleChipIntentClick('Mở bản đồ Hành trình', 'open_journey')
                }
                className="min-h-[34px] px-3 py-1 rounded-[18px] bg-[#EDE7FF] hover:bg-[#e0d6ff] text-[#23324D] font-kids font-extrabold text-xs whitespace-nowrap inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-700" />
                <span>Hành trình</span>
              </button>
              {QUICK_SUGGESTION_CARDS.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={isChatLoading}
                  onClick={() => handleQuickCardClick(card)}
                  className={`min-h-[34px] px-3 py-1 rounded-[18px] ${card.bgClass} text-[#23324D] font-kids font-extrabold text-xs whitespace-nowrap inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50`}
                >
                  {card.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Friendly Microphone Status Notice */}
      {micNote && (
        <div className="rounded-[18px] bg-[#FFF0C9] border border-amber-300/80 px-3 py-2 text-xs font-kids font-bold text-[#23324D] flex items-center justify-between gap-2 shrink-0">
          <span className="min-w-0 break-words">{micNote}</span>
          <button
            type="button"
            onClick={() => setMicNote(null)}
            className="text-xs underline shrink-0 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Always-Accessible Bottom Message Composer Bar */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] bg-white border border-[#23324D]/12 p-1.5 flex items-center gap-1.5 sm:gap-2 shadow-[0_6px_20px_rgba(35,50,77,0.06)] shrink-0"
      >
        <button
          type="button"
          onClick={handleToggleMic}
          className={`w-10 h-10 rounded-[18px] flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isListeningMic
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#3978F6]'
          }`}
          aria-label={isListeningMic ? 'Huỷ thu âm micro' : 'Nói bằng micro'}
          title={isListeningMic ? 'Bấm để huỷ nghe' : 'Nói bằng micro'}
        >
          {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Nhắn cho Buddy (VD: "Mình muốn chuẩn bị cặp sách")...'
          aria-label="Nhập tin nhắn gửi Buddy"
          className="flex-1 min-w-0 min-h-[40px] px-1.5 text-xs sm:text-sm font-kids font-bold text-[#23324D] placeholder:text-[#23324D]/45 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isChatLoading}
          aria-label="Gửi tin nhắn"
          className="min-h-[40px] px-3 sm:px-3.5 rounded-[18px] bg-[#3978F6] hover:bg-[#2964DF] disabled:opacity-40 text-white font-kids font-extrabold text-xs sm:text-sm inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          <span>Gửi</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

/**
 * v1.4 FLOATING BUDDY AI COMPANION (ICON-ONLY BUTTON + BOTTOM SHEET ON PHONE / DIALOG ON TABLET)
 * - Strictly icon-only circular trigger (56px / w-14 h-14 rounded-full) containing the 3D Buddy robot avatar.
 * - Bottom sheet on mobile (<768px) and compact dialog on tablet (>=768px) with visualViewport keyboard adaptation & safe-area support.
 */
export const FloatingBuddyChat: React.FC = () => {
  const {
    subView,
    voiceState,
    isChatLoading,
    isBuddyChatOpen,
    openBuddyChat,
    closeBuddyChat,
    minimizeBuddyChat,
  } = useBuddy();

  const [isInputFocusedOnPage, setIsInputFocusedOnPage] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        setIsInputFocusedOnPage(true);
      }
    };
    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement;
        const tag = active?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          setIsInputFocusedOnPage(false);
        }
      }, 150);
    };

    const handleVisualViewportResize = () => {
      if (window.visualViewport) {
        setViewportHeight(Math.round(window.visualViewport.height));
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    if (window.visualViewport) {
      handleVisualViewportResize();
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
    };
  }, []);

  // Do not show Floating Kid Assistant inside Parent Dashboard
  if (subView.type === 'parent-dashboard') {
    return null;
  }

  const isCompactTopMode =
    subView.type === 'guide-task' || subView.type === 'story-detail';

  const isSpeaking =
    voiceState.status === 'playing' || voiceState.status === 'speaking';

  return (
    <>
      {/* 1. Circular Icon-Only 3D Buddy Floating Button (56px, NO text label) */}
      {!isBuddyChatOpen && !isInputFocusedOnPage && (
        <button
          type="button"
          onClick={openBuddyChat}
          className={`${
            isCompactTopMode
              ? 'absolute top-3 right-3 z-40 w-12 h-12'
              : 'absolute bottom-[86px] right-4 z-40 w-14 h-14'
          } rounded-full bg-gradient-to-b from-[#EAF3FF] via-white to-[#DDF5E8] border-2 border-[#3978F6] shadow-[0_10px_26px_rgba(57,120,246,0.34)] hover:shadow-[0_14px_32px_rgba(57,120,246,0.48)] flex items-center justify-center transition-all active:scale-95 cursor-pointer`}
          aria-label="Mở Buddy · Bạn đồng hành"
          title="Buddy · Bạn đồng hành"
        >
          <div className="relative flex items-center justify-center">
            <BuddyAvatar
              size="xs"
              isSpeaking={isSpeaking}
              mood={isChatLoading ? 'thinking' : 'happy'}
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isSpeaking
                  ? 'bg-[#3978F6] animate-ping'
                  : isChatLoading
                  ? 'bg-[#F6B73C] animate-pulse'
                  : 'bg-[#2EC27E]'
              }`}
            />
          </div>
        </button>
      )}

      {/* 2. Floating Buddy Bottom Sheet (Phone <768px) / Compact Dialog (Tablet >=768px) */}
      {isBuddyChatOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-[#23324D]/45 backdrop-blur-[2px] animate-fadeIn p-0 md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              minimizeBuddyChat();
            }
          }}
        >
          <div
            style={
              viewportHeight
                ? { maxHeight: `${Math.max(280, viewportHeight - 12)}px` }
                : undefined
            }
            className="w-full md:max-w-[520px] max-h-[88dvh] md:max-h-[82dvh] bg-[#F7F9FD] rounded-t-[28px] md:rounded-[28px] shadow-[0_-12px_48px_rgba(35,50,77,0.24)] border border-white flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
          >
            {/* Drag Handle Bar */}
            <div className="pt-2 pb-0.5 flex justify-center shrink-0">
              <div className="w-11 h-1.5 rounded-full bg-[#23324D]/15" />
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-3.5 sm:px-5 pt-2 pb-3.5">
              <BuddyChatView
                isOverlaySheet
                onCloseSheet={closeBuddyChat}
                onMinimizeSheet={minimizeBuddyChat}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
