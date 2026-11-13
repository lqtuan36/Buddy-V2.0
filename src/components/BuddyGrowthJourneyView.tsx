import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  RotateCcw,
  Heart,
  BookOpen,
  Lightbulb,
  HandHeart,
  MessageCircleHeart,
  MapPin,
  X,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { useBuddy } from '../context/BuddyContext';
import {
  GrowthExperienceItem,
  GrowthExperienceStatus,
  GrowthExperienceType,
  GrowthQualityTopic,
} from '../types/domain';
import { BuddyAvatar } from './BuddyAvatar';
import {
  GrowthTopicIllustration,
  VIRTUE_ADVENTURE_PARCHMENT_MAP,
} from './BuddyIllustrations';
import { voiceService } from '../services/voiceService';
import { toBuddyCompanionUiText } from '../services/buddyCompanionLanguage';

const EXPERIENCE_TYPE_META: Record<
  GrowthExperienceType,
  {
    stepNumber: number;
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    cardBg: string;
    icon: React.ReactNode;
    starReward: number;
  }
> = {
  explore: {
    stepNumber: 1,
    label: '1. Khám phá',
    shortLabel: 'Khám phá',
    badgeBg: 'bg-[#EAF3FF]',
    badgeText: 'text-[#3978F6]',
    cardBg: 'bg-[#F7F9FD]',
    icon: <BookOpen className="w-3.5 h-3.5 text-[#3978F6]" />,
    starReward: 0,
  },
  understand: {
    stepNumber: 2,
    label: '2. Hiểu',
    shortLabel: 'Hiểu',
    badgeBg: 'bg-[#EDE7FF]',
    badgeText: 'text-[#6B3FA0]',
    cardBg: 'bg-[#FAF8FF]',
    icon: <Lightbulb className="w-3.5 h-3.5 text-[#6B3FA0]" />,
    starReward: 0,
  },
  practice: {
    stepNumber: 3,
    label: '3. Thực hành',
    shortLabel: 'Thực hành',
    badgeBg: 'bg-[#DDF5E8]',
    badgeText: 'text-[#188050]',
    cardBg: 'bg-[#F4FBF7]',
    icon: <HandHeart className="w-3.5 h-3.5 text-[#188050]" />,
    starReward: 2,
  },
  share: {
    stepNumber: 4,
    label: '4. Chia sẻ',
    shortLabel: 'Chia sẻ',
    badgeBg: 'bg-[#FFE4D8]',
    badgeText: 'text-[#C84B20]',
    cardBg: 'bg-[#FFF9F6]',
    icon: <MessageCircleHeart className="w-3.5 h-3.5 text-[#C84B20]" />,
    starReward: 1,
  },
};

const STATUS_META: Record<
  GrowthExperienceStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    ringColor: string;
    pinBg: string;
  }
> = {
  not_explored: {
    label: 'Chưa khám phá',
    bg: 'bg-slate-100',
    text: 'text-[#5C6F8C]',
    dot: 'bg-slate-400',
    ringColor: 'border-amber-900/25',
    pinBg: 'bg-white/95',
  },
  in_progress: {
    label: 'Đang khám phá',
    bg: 'bg-[#EAF3FF]',
    text: 'text-[#3978F6]',
    dot: 'bg-[#3978F6]',
    ringColor: 'border-[#3978F6]',
    pinBg: 'bg-[#EAF3FF]',
  },
  experienced: {
    label: 'Đã hoàn thành',
    bg: 'bg-[#DDF5E8]',
    text: 'text-[#188050]',
    dot: 'bg-[#2EC27E]',
    ringColor: 'border-[#2EC27E]',
    pinBg: 'bg-[#DDF5E8]',
  },
  want_to_retry: {
    label: 'Mình muốn thử lại',
    bg: 'bg-[#FFF0C9]',
    text: 'text-[#9A6700]',
    dot: 'bg-[#F6B73C]',
    ringColor: 'border-[#F6B73C]',
    pinBg: 'bg-[#FFF0C9]',
  },
};

const EMOTION_TAGS = [
  { id: 'vui-ve', emoji: '😊', text: 'Vui vẻ', label: 'Vui vẻ 😊' },
  { id: 'am-ap', emoji: '💖', text: 'Ấm áp', label: 'Ấm áp 💖' },
  { id: 'tu-hao', emoji: '🌟', text: 'Tự hào', label: 'Tự hào 🌟' },
  { id: 'hao-hung', emoji: '🎉', text: 'Hào hứng', label: 'Hào hứng 🎉' },
  { id: 'binh-tinh', emoji: '🌿', text: 'Bình tĩnh', label: 'Bình tĩnh 🌿' },
  { id: 'tu-tin', emoji: '💪', text: 'Tự tin', label: 'Tự tin 💪' },
];

const CHOICE_BADGE_ICONS = ['🌟', '💡', '💛', '🌱'];

/**
 * Default percentage coordinates along the winding trail on the vintage parchment adventure map
 * (From bottom forest entry at y=88% up across the wooden bridge, waterfall, hill, to the top peak at y=19%)
 */
const DEFAULT_TRAIL_COORDS: Array<{ x: number; y: number }> = [
  { x: 46, y: 88 }, // 1. Forest Trailhead
  { x: 34, y: 76 }, // 2. Meadow Bend
  { x: 54, y: 65 }, // 3. Wooden Bridge over Stream
  { x: 64, y: 54 }, // 4. Sparkling Waterfall Bank
  { x: 38, y: 44 }, // 5. Cozy Cottage Crossroads
  { x: 62, y: 35 }, // 6. Pine Ridge Slope
  { x: 38, y: 26 }, // 7. Sunlit Mountain Bend
  { x: 52, y: 17 }, // 8. Golden Summit Gate
];

interface CelebrationScreenState {
  stepType: GrowthExperienceType;
  stepTitle: string;
  praiseHeadline: string;
  feedbackDetail: string;
  starsAwarded: number;
  nextExpId: string | null;
  nextStepLabel: string | null;
}

export const BuddyGrowthJourneyView: React.FC = () => {
  const {
    data,
    voiceState,
    selectedJourneyTopicId,
    setSelectedJourneyTopicId,
    updateGrowthExperienceStatus,
    openBuddyChat,
    sendChatMessage,
  } = useBuddy();

  // Only show parent-approved & selected topics to child
  const approvedTopics = (data.growthTopics || [])
    .filter((t) => t.approvalStatus === 'approved' && t.selectedByParent)
    .sort((a, b) => a.stageOrder - b.stageOrder);

  // Popup modal state: null when closed, topicId when open (preserves roadmap scroll position!)
  const [popupTopicId, setPopupTopicId] = useState<string | null>(null);
  const [showTreasureModal, setShowTreasureModal] = useState(false);
  const [mapImgError, setMapImgError] = useState(false);

  const popupTopic: GrowthQualityTopic | undefined = approvedTopics.find(
    (t) => t.id === popupTopicId
  );

  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [selectedSingleChoice, setSelectedSingleChoice] = useState<string>('');
  const [selectedMultiChoices, setSelectedMultiChoices] = useState<string[]>([]);
  const [selectedEmotionTag, setSelectedEmotionTag] = useState<string>('');
  const [reflectionInput, setReflectionInput] = useState<string>('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isPromptExpanded, setIsPromptExpanded] = useState<boolean>(false);
  const [celebrationState, setCelebrationState] =
    useState<CelebrationScreenState | null>(null);

  const activeExperience: GrowthExperienceItem | undefined =
    popupTopic?.experiences.find((e) => e.id === selectedExpId) ||
    popupTopic?.experiences.find((e) => e.status !== 'experienced') ||
    popupTopic?.experiences[0];

  const isSpeaking =
    voiceState.status === 'playing' || voiceState.status === 'speaking';

  // Synchronize step state when switching experience step inside popup
  useEffect(() => {
    if (!activeExperience) return;
    setReflectionInput(activeExperience.childResponse || '');
    setSelectedSingleChoice(
      activeExperience.type === 'understand'
        ? activeExperience.childResponse || ''
        : ''
    );
    setSelectedMultiChoices(activeExperience.selectedChoices || []);
    setSelectedEmotionTag(activeExperience.emotionTag || '');
    setFeedbackNotice(null);
    setIsPromptExpanded(false);
    setCelebrationState(null);
  }, [activeExperience?.id, popupTopicId]);

  const handleOpenNodePopup = (topic: GrowthQualityTopic) => {
    voiceService.cancel();
    setSelectedJourneyTopicId(topic.id);
    setPopupTopicId(topic.id);
    const firstUnfinished =
      topic.experiences.find((e) => e.status !== 'experienced') ||
      topic.experiences[0];
    setSelectedExpId(firstUnfinished?.id || null);
    setCelebrationState(null);
  };

  const handleCloseNodePopup = () => {
    voiceService.cancel();
    setPopupTopicId(null);
    setFeedbackNotice(null);
    setCelebrationState(null);
  };

  const handleSelectStepTab = (expId: string) => {
    voiceService.cancel();
    setSelectedExpId(expId);
    setFeedbackNotice(null);
    setCelebrationState(null);
  };

  const getNextExperience = (
    topic: GrowthQualityTopic,
    currentExp: GrowthExperienceItem
  ): GrowthExperienceItem | null => {
    const idx = topic.experiences.findIndex((e) => e.id === currentExp.id);
    if (idx >= 0 && idx < topic.experiences.length - 1) {
      return topic.experiences[idx + 1];
    }
    return null;
  };

  const handleSpeakExperience = (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    const cleanPrompt = toBuddyCompanionUiText(exp.promptOrStory);
    const cleanTitle = toBuddyCompanionUiText(exp.title);

    if (exp.type === 'explore') {
      const textToSpeak = `${topic.title}. Câu chuyện nhỏ: ${cleanTitle}. ${cleanPrompt}`;
      voiceService.speak(textToSpeak, data.voicePreference, 'guide');
      return;
    }

    if (exp.type === 'understand') {
      const choicesText =
        exp.choices && exp.choices.length > 0
          ? ` Bạn sẽ chọn cách nào? ${exp.choices
              .map((c, i) => `Cách ${i + 1}: ${toBuddyCompanionUiText(c)}`)
              .join('. ')}.`
          : '';
      const textToSpeak = `${cleanTitle}. ${cleanPrompt}${choicesText}`;
      voiceService.speak(textToSpeak, data.voicePreference, 'guide');
      return;
    }

    if (exp.type === 'practice') {
      const actionText = exp.actionSuggestion
        ? ` Việc mình cùng thử làm hôm nay là: ${toBuddyCompanionUiText(
            exp.actionSuggestion
          )}.`
        : '';
      const textToSpeak = `Thử thách thực hành: ${cleanTitle}. ${cleanPrompt}${actionText}`;
      voiceService.speak(textToSpeak, data.voicePreference, 'guide');
      return;
    }

    const textToSpeak = `Hôm nay bạn cảm thấy thế nào? ${cleanPrompt}`;
    voiceService.speak(textToSpeak, data.voicePreference, 'guide');
  };

  const handleToggleMultiChoice = (choice: string) => {
    setSelectedMultiChoices((prev) =>
      prev.includes(choice) ? prev.filter((c) => c !== choice) : [...prev, choice]
    );
  };

  // Step 1 ("Khám phá") primary action: mark explore as experienced and go directly to Step 2 ("Hiểu")
  const handleCompleteExploreStep = async (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    voiceService.cancel();
    await updateGrowthExperienceStatus(
      topic.id,
      exp.id,
      'experienced',
      exp.childResponse || 'Mình đã lắng nghe và khám phá tình huống cùng Buddy',
      { realLifeConfirmed: false }
    );
    const nextExp = getNextExperience(topic, exp);
    if (nextExp) {
      setSelectedExpId(nextExp.id);
    }
  };

  // Step 2 ("Hiểu") choice click: select choice and speak Buddy's warm feedback
  const handlePickUnderstandChoice = (
    exp: GrowthExperienceItem,
    choice: string
  ) => {
    setSelectedSingleChoice(choice);
    setReflectionInput(choice);
    const praise = toBuddyCompanionUiText(
      exp.buddyWarmFeedback ||
        'Tuyệt quá! Cách bạn chọn thật ấm áp và đáng khen!'
    );
    voiceService.speak(praise, data.voicePreference, 'celebration');
  };

  // Step 2 ("Hiểu") primary action: save selected answer and advance to Step 3 ("Thực hành")
  const handleCompleteUnderstandStep = async (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    voiceService.cancel();
    const chosenAnswer =
      selectedSingleChoice ||
      exp.choices?.[0] ||
      'Mình đã suy nghĩ và chọn cách ứng xử phù hợp';
    await updateGrowthExperienceStatus(
      topic.id,
      exp.id,
      'experienced',
      chosenAnswer,
      { realLifeConfirmed: false }
    );
    const nextExp = getNextExperience(topic, exp);
    if (nextExp) {
      setSelectedExpId(nextExp.id);
    }
  };

  // Step 3 ("Thực hành") primary action: "Mình làm xong rồi nè!" -> confirms real-life action & opens Celebration Screen
  const handleCompletePracticeStep = async (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    voiceService.cancel();
    const note =
      exp.actionSuggestion ||
      reflectionInput.trim() ||
      `Mình đã thực hành: ${exp.title}`;
    const res = await updateGrowthExperienceStatus(
      topic.id,
      exp.id,
      'experienced',
      note,
      {
        realLifeConfirmed: true,
      }
    );

    const nextExp = getNextExperience(topic, exp);
    const praiseHeadline =
      'Yay! Bạn làm được rồi! Mình vui lắm vì bạn đã thử một việc thật ý nghĩa!';
    const feedbackDetail = toBuddyCompanionUiText(
      exp.buddyWarmFeedback || res.message
    );

    setCelebrationState({
      stepType: 'practice',
      stepTitle: exp.title,
      praiseHeadline,
      feedbackDetail,
      starsAwarded: res.starsAdded,
      nextExpId: nextExp?.id || null,
      nextStepLabel: nextExp
        ? `Tiếp tục: ${EXPERIENCE_TYPE_META[nextExp.type].label}`
        : null,
    });

    voiceService.speak(
      `${praiseHeadline} ${feedbackDetail}`,
      data.voicePreference,
      'celebration'
    );
  };

  // Step 3 ("Thực hành") or Step 4 ("Chia sẻ") secondary action: "Mình thử sau nha" / "Mình muốn thử lại"
  // CRITICAL: Never marks 'experienced' and never awards stars when child chooses retry/later!
  const handleTryLaterStep = async (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    voiceService.cancel();
    await updateGrowthExperienceStatus(
      topic.id,
      exp.id,
      'want_to_retry',
      exp.childResponse || 'Mình sẽ thử thực hành sau nha',
      {
        selectedChoices: selectedMultiChoices,
        emotionTag: selectedEmotionTag,
        realLifeConfirmed: false,
      }
    );
    const gentleMsg =
      'Không sao đâu! Khi nào sẵn sàng thực hành ngoài đời thực, bạn quay lại kể cho mình nghe nhé!';
    setFeedbackNotice(gentleMsg);
    voiceService.speak(gentleMsg, data.voicePreference, 'guide');
  };

  // Step 4 ("Chia sẻ") primary action: "Lưu chia sẻ của mình!" -> saves emotion & reflection and opens Celebration Screen
  const handleCompleteShareStep = async (
    topic: GrowthQualityTopic,
    exp: GrowthExperienceItem
  ) => {
    voiceService.cancel();
    const parts: string[] = [];
    if (selectedEmotionTag) {
      parts.push(`Cảm xúc: ${selectedEmotionTag}`);
    }
    if (selectedMultiChoices.length > 0) {
      parts.push(selectedMultiChoices.join('; '));
    }
    if (reflectionInput.trim()) {
      parts.push(reflectionInput.trim());
    }
    const combinedNote =
      parts.join(' · ') ||
      exp.childResponse ||
      'Mình thấy rất vui khi chia sẻ cùng Buddy';

    const res = await updateGrowthExperienceStatus(
      topic.id,
      exp.id,
      'experienced',
      combinedNote,
      {
        selectedChoices: selectedMultiChoices,
        emotionTag: selectedEmotionTag || 'Vui vẻ 😊',
        realLifeConfirmed: true,
      }
    );

    const praiseHeadline =
      'Yay! Cảm ơn bạn đã chia sẻ cảm xúc thật đẹp cùng mình!';
    const feedbackDetail = toBuddyCompanionUiText(
      exp.buddyWarmFeedback || res.message
    );

    setCelebrationState({
      stepType: 'share',
      stepTitle: exp.title,
      praiseHeadline,
      feedbackDetail,
      starsAwarded: res.starsAdded,
      nextExpId: null,
      nextStepLabel: null,
    });

    voiceService.speak(
      `${praiseHeadline} ${feedbackDetail}`,
      data.voicePreference,
      'celebration'
    );
  };

  const getTopicStatusMeta = (topic: GrowthQualityTopic) => {
    const expCount = topic.experiences.filter(
      (e) => e.status === 'experienced'
    ).length;
    const retryCount = topic.experiences.filter(
      (e) => e.status === 'want_to_retry'
    ).length;
    const inProgCount = topic.experiences.filter(
      (e) => e.status === 'in_progress'
    ).length;
    if (expCount === topic.experiences.length && topic.experiences.length > 0) {
      return STATUS_META.experienced;
    }
    if (retryCount > 0 && expCount === 0 && inProgCount === 0) {
      return STATUS_META.want_to_retry;
    }
    if (expCount > 0 || inProgCount > 0 || retryCount > 0) {
      return STATUS_META.in_progress;
    }
    return STATUS_META.not_explored;
  };

  const totalExperiencedStages = approvedTopics.filter(
    (t) => t.experiences.filter((e) => e.status === 'experienced').length >= 2
  ).length;

  const totalExperiencedSteps = approvedTopics.reduce(
    (acc, t) =>
      acc + t.experiences.filter((e) => e.status === 'experienced').length,
    0
  );

  // Compute node coordinates on the parchment adventure map with safe horizontal margins so full titles never clip
  const positionedNodes = approvedTopics.map((topic, idx) => {
    const fallback = DEFAULT_TRAIL_COORDS[idx % DEFAULT_TRAIL_COORDS.length];
    const ySpread =
      approvedTopics.length > 8
        ? Math.round(
            88 - (idx / Math.max(1, approvedTopics.length - 1)) * 70
          )
        : topic.yPercent ?? fallback.y;
    const rawX = topic.xPercent ?? fallback.x;
    const safeX = Math.max(32, Math.min(68, rawX));
    return {
      topic,
      x: safeX,
      y: ySpread,
    };
  });

  const currentFocusTopic =
    approvedTopics.find((t) => t.id === selectedJourneyTopicId) ||
    approvedTopics.find((t) => t.isCurrentFocus) ||
    approvedTopics[0];

  const renderConciseStoryText = (rawText: string) => {
    const cleanText = toBuddyCompanionUiText(rawText);
    const MAX_PREVIEW_CHARS = 210;
    if (cleanText.length <= MAX_PREVIEW_CHARS) {
      return (
        <p className="text-sm sm:text-base font-bold text-[#23324D] leading-relaxed">
          {cleanText}
        </p>
      );
    }

    const previewSlice = cleanText
      .slice(0, MAX_PREVIEW_CHARS)
      .replace(/\s+\S*$/, '');
    return (
      <div className="space-y-2">
        <p className="text-sm sm:text-base font-bold text-[#23324D] leading-relaxed">
          {isPromptExpanded ? cleanText : `${previewSlice}...`}
        </p>
        <button
          type="button"
          onClick={() => setIsPromptExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-kids font-extrabold text-[#3978F6] hover:underline cursor-pointer"
        >
          {isPromptExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Thu gọn</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Xem thêm</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Compact Journey Header & Buddy Guide Bar */}
      <div className="rounded-[26px] bg-white border border-[#23324D]/8 p-4 shadow-[0_8px_24px_rgba(35,50,77,0.06)] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0C9] text-[#7A4F00] text-[11px] font-kids font-extrabold">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Bản đồ phiêu lưu · {data.profile.displayName}
              </span>
            </span>
            <h1 className="font-kids font-extrabold text-xl sm:text-2xl text-[#23324D] mt-1">
              Hành trình của mình
            </h1>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-2xl bg-[#DDF5E8] text-[#188050] font-kids font-extrabold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{totalExperiencedSteps} dấu ấn</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 bg-[#F7F9FD] rounded-[18px] p-2.5 border border-[#23324D]/6">
          <div className="flex items-center gap-2.5 min-w-0">
            <BuddyAvatar size="xs" isSpeaking={isSpeaking} mood="happy" />
            <p className="font-kids text-xs sm:text-sm font-bold text-[#23324D] leading-snug">
              Bạn chạm vào từng trạm trên bản đồ để cùng mình khám phá câu chuyện và thử việc tốt hôm nay nhé!
            </p>
          </div>
          {currentFocusTopic && (
            <button
              type="button"
              onClick={() => handleOpenNodePopup(currentFocusTopic)}
              className="shrink-0 px-3.5 py-2 rounded-[18px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-xs transition-colors cursor-pointer"
            >
              Mở chặng {currentFocusTopic.stageOrder}
            </button>
          )}
        </div>
      </div>

      {/* 2. Illustrated Vintage Parchment Adventure Roadmap */}
      <section
        aria-label="Bản đồ phiêu lưu phẩm chất"
        className="rounded-[30px] bg-[#F5E6C8] border-2 border-[#C8A97E] shadow-[0_14px_36px_rgba(92,64,28,0.16)] overflow-hidden relative"
      >
        {/* Top Parchment Legend Bar */}
        <div className="bg-[#FDF6E7]/95 backdrop-blur-xs border-b border-[#C8A97E]/50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 z-20 relative">
          <span className="font-kids font-extrabold text-xs sm:text-sm text-[#4A3520] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#D97706]" />
            <span>Đường mòn Khám Phá ({approvedTopics.length} chặng)</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-kids font-extrabold">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DDF5E8] text-[#188050]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2EC27E]" />
              Đã hoàn thành
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#3978F6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3978F6]" />
              Đang khám phá
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[#5C6F8C]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Chưa khám phá
            </span>
          </div>
        </div>

        {/* Scrollable / Responsive Adventure Map Canvas */}
        <div className="relative w-full h-[840px] sm:h-[900px] md:h-[940px] select-none overflow-hidden bg-gradient-to-b from-[#FAF0D7] via-[#E8F3D8] to-[#DCECC9]">
          {/* Background Illustrated Parchment Map */}
          {!mapImgError ? (
            <img
              src={VIRTUE_ADVENTURE_PARCHMENT_MAP}
              alt="Bản đồ phiêu lưu Hành trình của mình"
              loading="eager"
              decoding="async"
              onError={() => setMapImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#FDF3DC] via-[#DDF5E8] to-[#C7E9B4]" />
          )}

          {/* Subtle warm vignette for high contrast of Vietnamese node cards */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#23324D]/10 via-transparent to-[#23324D]/20 pointer-events-none" />

          {/* SVG Winding Trail Connecting All Checkpoints & Treasure Chest */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            {positionedNodes.map((node, i) => {
              const next =
                i < positionedNodes.length - 1
                  ? positionedNodes[i + 1]
                  : { x: 50, y: 7 };
              const isCompleted =
                node.topic.experiences.filter((e) => e.status === 'experienced')
                  .length === node.topic.experiences.length;
              return (
                <line
                  key={`line-${node.topic.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={next.x}
                  y2={next.y}
                  stroke={isCompleted ? '#2EC27E' : '#FFFFFF'}
                  strokeWidth="0.9"
                  strokeDasharray={isCompleted ? 'none' : '1.8 1.4'}
                  strokeLinecap="round"
                  opacity="0.92"
                />
              );
            })}
          </svg>

          {/* Destination: Glowing Treasure Chest at the Summit (y = 7%) */}
          <div
            style={{ left: '50%', top: '6.5%' }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setShowTreasureModal(true)}
              className="group px-3.5 py-2 rounded-[18px] bg-gradient-to-r from-[#FFF0C9] via-[#FFE082] to-[#FFF0C9] border-2 border-amber-500 shadow-[0_8px_22px_rgba(217,119,6,0.38)] hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="text-lg">🏆</span>
              <div className="text-left">
                <span className="block font-kids font-extrabold text-xs sm:text-sm text-[#6B3E00] leading-none">
                  Rương Kho Báu Phẩm Chất
                </span>
                <span className="block text-[10px] font-bold text-[#8A5A00] mt-0.5">
                  Đã mở {totalExperiencedStages}/{approvedTopics.length} chặng · Chạm để xem
                </span>
              </div>
            </button>
          </div>

          {/* Interactive JourneyNode Checkpoints along the Trail — FULL TITLES NEVER TRUNCATED */}
          {positionedNodes.map(({ topic, x, y }) => {
            const statusMeta = getTopicStatusMeta(topic);
            const experiencedCount = topic.experiences.filter(
              (e) => e.status === 'experienced'
            ).length;
            const isFocus = Boolean(topic.isCurrentFocus);

            return (
              <div
                key={topic.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <button
                  type="button"
                  onClick={() => handleOpenNodePopup(topic)}
                  className={`group relative flex items-center gap-2.5 p-2 pr-3.5 rounded-[22px] border-2 ${statusMeta.ringColor} bg-white/96 hover:bg-white shadow-[0_8px_22px_rgba(35,50,77,0.22)] hover:scale-105 active:scale-95 transition-all cursor-pointer min-w-[186px] max-w-[235px] sm:max-w-[275px]`}
                  aria-label={`Mở chặng ${topic.stageOrder}: ${topic.title}`}
                >
                  {/* Focus Pulse Badge */}
                  {isFocus && (
                    <span className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-[#3978F6] text-white font-kids font-extrabold text-[9px] shadow-2xs whitespace-nowrap">
                      Chặng mình đang khám phá
                    </span>
                  )}

                  {/* Circular Checkpoint Pin with Stage Number & Warm Storybook Illustration */}
                  <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#F7F9FD] border-2 border-white shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                    <GrowthTopicIllustration
                      slug={topic.slug}
                      className="w-full h-full rounded-full"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#23324D] text-white font-kids font-extrabold text-[10px] flex items-center justify-center border border-white">
                      {topic.stageOrder}
                    </span>
                  </div>

                  {/* Full Vietnamese Title (No Truncate!) & 4-Step Progress Badge */}
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-kids font-extrabold text-xs sm:text-sm text-[#23324D] leading-snug whitespace-normal break-words">
                      {topic.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-kids font-extrabold ${statusMeta.bg} ${statusMeta.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                      <span className="text-[10px] font-kids font-extrabold text-[#5C6F8C] tabular-nums">
                        {experiencedCount}/{topic.experiences.length}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Bottom Start Banner on Map */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-[#23324D]/90 text-white font-kids font-extrabold text-[11px] shadow-md whitespace-nowrap">
            🚩 Điểm xuất phát: Rừng Thông Ánh Sáng · Chạm trạm số 1 để bắt đầu
          </div>
        </div>
      </section>

      {/* 3. Warm Storybook Stage Cards Grid (Full Virtue Names + Warm Storybook Scene Illustrations) */}
      <section className="bg-white rounded-[26px] p-4 shadow-[0_8px_24px_rgba(35,50,77,0.06)] border border-[#23324D]/8 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-kids font-extrabold text-[#3978F6]">
              Minh họa Warm Storybook từng phẩm chất
            </span>
            <h2 className="font-kids font-extrabold text-base sm:text-lg text-[#23324D]">
              Các chặng trên Hành trình của mình ({approvedTopics.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#5C6F8C]">
            Chạm để khám phá
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {approvedTopics.map((topic) => {
            const statusMeta = getTopicStatusMeta(topic);
            const doneCount = topic.experiences.filter(
              (e) => e.status === 'experienced'
            ).length;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleOpenNodePopup(topic)}
                className="group text-left rounded-[22px] p-2.5 bg-[#F7F9FD] hover:bg-[#EAF3FF]/65 border border-[#23324D]/8 hover:border-[#3978F6] transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="relative">
                    <GrowthTopicIllustration
                      slug={topic.slug}
                      variant="scene"
                      className="w-full h-28 sm:h-32 rounded-[16px]"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[#3978F6] font-kids font-extrabold text-[10px] shadow-2xs">
                      Chặng {topic.stageOrder}
                    </span>
                  </div>
                  <div className="px-0.5">
                    <h3 className="font-kids font-extrabold text-xs sm:text-sm text-[#23324D] leading-snug whitespace-normal break-words">
                      {topic.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#5C6F8C] line-clamp-1 mt-0.5">
                      {topic.landmarkName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 px-0.5 border-t border-[#23324D]/6">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-kids font-extrabold ${statusMeta.bg} ${statusMeta.text}`}
                  >
                    {statusMeta.label}
                  </span>
                  <span className="text-[10px] font-kids font-bold text-[#5C6F8C] tabular-nums">
                    {doneCount}/{topic.experiences.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =======================================================================
          STEP-BY-STEP VIRTUE ADVENTURE MODAL (BUDDY V2.1 PART II)
          "Một màn hình – Một mục tiêu – Một hành động chính"
          Opens as Bottom Sheet on Phone (<768px) or Dialog Sheet on Tablet (>=768px)
          without losing scroll position on the roadmap!
          ======================================================================= */}
      {popupTopic && activeExperience && (
        <div
          className="fixed inset-0 z-50 bg-[#23324D]/60 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseNodePopup();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={popupTopic.title}
            className="w-full md:max-w-[580px] max-h-[90dvh] bg-[#F7F9FD] rounded-t-[32px] md:rounded-[32px] shadow-[0_-14px_48px_rgba(35,50,77,0.28)] border border-white flex flex-col overflow-hidden"
          >
            {/* 1. HEADER: Back/Close button + Virtue Title + Stage Label + 4-Step Progress Bar */}
            <div className="pt-2.5 px-4 pb-3 bg-white border-b border-[#23324D]/8 shrink-0">
              <div className="md:hidden w-12 h-1.5 rounded-full bg-[#23324D]/15 mx-auto mb-2" />

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseNodePopup}
                  className="min-h-[38px] px-3 py-1.5 rounded-[16px] bg-[#F7F9FD] hover:bg-[#EAF3FF] text-[#23324D] font-kids font-extrabold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  aria-label="Quay về bản đồ"
                >
                  <ChevronLeft className="w-4 h-4 text-[#3978F6]" />
                  <span>Bản đồ</span>
                </button>

                <div className="text-center min-w-0 flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAF3FF] text-[#3978F6] font-kids font-extrabold text-[10px]">
                    Chặng {popupTopic.stageOrder}
                  </span>
                  <h2 className="font-kids font-extrabold text-base sm:text-lg text-[#23324D] leading-tight truncate mt-0.5">
                    {popupTopic.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleCloseNodePopup}
                  className="w-9 h-9 rounded-[16px] bg-[#F7F9FD] hover:bg-[#EAF3FF] text-[#5C6F8C] hover:text-[#23324D] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  aria-label="Đóng cửa sổ chặng phẩm chất"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Interactive Progress Bar: 1. Khám phá · 2. Hiểu · 3. Thực hành · 4. Chia sẻ */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {popupTopic.experiences.map((exp) => {
                  const meta = EXPERIENCE_TYPE_META[exp.type];
                  const isCurrent =
                    !celebrationState && exp.id === activeExperience.id;
                  const isDone = exp.status === 'experienced';
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => handleSelectStepTab(exp.id)}
                      className={`p-2 rounded-[16px] border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-[#3978F6] bg-[#EAF3FF] shadow-2xs'
                          : isDone
                          ? 'border-[#2EC27E]/50 bg-[#DDF5E8]/45 hover:bg-[#DDF5E8]/70'
                          : 'border-[#23324D]/8 bg-[#F7F9FD] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-kids font-extrabold text-[11px] truncate ${
                            isCurrent ? 'text-[#3978F6]' : 'text-[#23324D]'
                          }`}
                        >
                          {meta.stepNumber}. {meta.shortLabel}
                        </span>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#188050] shrink-0" />
                        ) : meta.starReward > 0 ? (
                          <span className="text-[10px] font-kids font-extrabold text-amber-700 shrink-0">
                            +{meta.starReward}★
                          </span>
                        ) : null}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/80 overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDone
                              ? 'w-full bg-[#2EC27E]'
                              : isCurrent
                              ? 'w-2/3 bg-[#3978F6]'
                              : 'w-0'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. MAIN CONTENT + STICKY SINGLE-GOAL FOOTER */}
            {celebrationState ? (
              /* ==============================================================
                 SECTION 2.8: CELEBRATION SCREEN (MÀN HÌNH CHÚC MỪNG)
                 ============================================================== */
              <>
                <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col items-center text-center justify-center space-y-4">
                  <div className="relative w-full max-w-[340px]">
                    <GrowthTopicIllustration
                      slug={popupTopic.slug}
                      variant="scene"
                      className="w-full h-44 sm:h-48 rounded-[24px] shadow-md border-2 border-amber-300"
                    />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FFF0C9] via-[#FFE082] to-[#FFF0C9] border-2 border-amber-400 shadow-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400" />
                      <span className="font-kids font-extrabold text-xs text-[#7A4F00] whitespace-nowrap">
                        {celebrationState.starsAwarded > 0
                          ? `Thưởng +${celebrationState.starsAwarded} ★ Ngôi sao của mình!`
                          : 'Hoàn thành xuất sắc!'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2 max-w-md">
                    <h3 className="font-kids font-extrabold text-xl sm:text-2xl text-[#23324D] leading-snug">
                      {celebrationState.praiseHeadline}
                    </h3>
                    <div className="rounded-[22px] bg-white border border-[#23324D]/8 p-3.5 shadow-2xs flex items-start gap-3 text-left">
                      <BuddyAvatar
                        size="sm"
                        isSpeaking={isSpeaking}
                        mood="celebrating"
                      />
                      <p className="text-xs sm:text-sm font-bold text-[#23324D] leading-relaxed">
                        {celebrationState.feedbackDetail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:px-5 bg-white border-t border-[#23324D]/8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  {celebrationState.nextExpId && celebrationState.nextStepLabel ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          voiceService.cancel();
                          setSelectedExpId(celebrationState.nextExpId);
                          setCelebrationState(null);
                        }}
                        className="flex-1 min-h-[48px] px-5 py-3 rounded-[20px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{celebrationState.nextStepLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseNodePopup}
                        className="min-h-[48px] px-4 py-2.5 rounded-[20px] bg-[#F7F9FD] hover:bg-[#EAF3FF] text-[#23324D] font-kids font-extrabold text-xs sm:text-sm inline-flex items-center justify-center cursor-pointer"
                      >
                        Quay về bản đồ
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCloseNodePopup}
                      className="w-full min-h-[48px] px-5 py-3 rounded-[20px] bg-[#2EC27E] hover:bg-[#25a86b] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Quay về bản đồ</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ==============================================================
                 SINGLE-GOAL STEP VIEW:
                 1. Khám phá | 2. Hiểu | 3. Thực hành | 4. Chia sẻ
                 ============================================================== */
              <>
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Top Illustration & Voice Read-Aloud Card */}
                  <div className="rounded-[24px] bg-white border border-[#23324D]/8 p-3.5 shadow-2xs space-y-3">
                    <GrowthTopicIllustration
                      slug={popupTopic.slug}
                      variant="scene"
                      showCaption
                      className="w-full h-44 sm:h-52 rounded-[20px]"
                    />

                    <div className="flex items-center justify-between gap-2.5 pt-1">
                      <div className="min-w-0 space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-kids font-extrabold ${
                            EXPERIENCE_TYPE_META[activeExperience.type].badgeBg
                          } ${
                            EXPERIENCE_TYPE_META[activeExperience.type].badgeText
                          }`}
                        >
                          {EXPERIENCE_TYPE_META[activeExperience.type].icon}
                          {EXPERIENCE_TYPE_META[activeExperience.type].label}
                        </span>
                        <h3 className="font-kids font-extrabold text-base sm:text-lg text-[#23324D] leading-snug">
                          {toBuddyCompanionUiText(activeExperience.title)}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleSpeakExperience(popupTopic, activeExperience)
                        }
                        className={`shrink-0 inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-[18px] font-kids font-extrabold text-xs transition-colors cursor-pointer ${
                          isSpeaking
                            ? 'bg-[#3978F6] text-white'
                            : 'bg-[#EAF3FF] hover:bg-[#3978F6] text-[#3978F6] hover:text-white'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>
                          {activeExperience.type === 'explore'
                            ? 'Nghe Buddy kể'
                            : activeExperience.type === 'practice'
                            ? 'Nghe hướng dẫn'
                            : 'Nghe Buddy đọc'}
                        </span>
                      </button>
                    </div>

                    {/* Buddy Story / Situation Bubble */}
                    <div className="rounded-[18px] bg-[#F7F9FD] p-3.5 border border-[#23324D]/6 flex items-start gap-3">
                      <BuddyAvatar
                        size="xs"
                        isSpeaking={isSpeaking}
                        mood="happy"
                      />
                      <div className="min-w-0 flex-1">
                        {renderConciseStoryText(activeExperience.promptOrStory)}
                      </div>
                    </div>
                  </div>

                  {/* ==========================================================
                      STEP 1: KHÁM PHÁ (EXPLORE) — Section 2.4
                      Only story + illustration + warm Buddy takeaway. No inputs!
                     ========================================================== */}
                  {activeExperience.type === 'explore' && (
                    <div className="rounded-[22px] bg-[#FFF9EB] border border-amber-300/80 p-3.5 flex items-start gap-3">
                      <span className="text-xl shrink-0">🌟</span>
                      <p className="text-xs sm:text-sm font-kids font-bold text-[#7A4F00] leading-relaxed">
                        {toBuddyCompanionUiText(
                          activeExperience.buddyWarmFeedback
                        )}
                      </p>
                    </div>
                  )}

                  {/* ==========================================================
                      STEP 2: HIỂU (UNDERSTAND) — Section 2.5
                      Question "Bạn sẽ chọn cách nào?" + Large visual choice cards
                      + Immediate warm Buddy feedback bubble when selected.
                     ========================================================== */}
                  {activeExperience.type === 'understand' && (
                    <div className="rounded-[24px] bg-white border border-[#23324D]/8 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-kids font-extrabold text-sm sm:text-base text-[#23324D]">
                          Bạn sẽ chọn cách nào?
                        </p>
                        <span className="text-[11px] font-bold text-[#5C6F8C]">
                          Chạm vào 1 cách bên dưới nhé
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {(activeExperience.choices &&
                        activeExperience.choices.length > 0
                          ? activeExperience.choices
                          : [
                              'Nói lời chân thành và cư xử ấm áp với mọi người',
                              'Chủ động giúp đỡ một việc nhỏ vừa sức của mình',
                              'Chia sẻ niềm vui cùng ba mẹ và bạn bè',
                            ]
                        ).map((rawChoice, idx) => {
                          const cleanChoice = toBuddyCompanionUiText(rawChoice);
                          const isPicked =
                            selectedSingleChoice === rawChoice ||
                            selectedSingleChoice === cleanChoice;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                handlePickUnderstandChoice(
                                  activeExperience,
                                  cleanChoice
                                )
                              }
                              className={`w-full min-h-[56px] text-left p-3.5 rounded-[20px] border-2 font-kids font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isPicked
                                  ? 'border-[#2EC27E] bg-[#DDF5E8]/70 text-[#188050] shadow-2xs'
                                  : 'border-[#23324D]/10 bg-[#F7F9FD] text-[#23324D] hover:border-[#3978F6]/60 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="w-8 h-8 rounded-2xl bg-white flex items-center justify-center text-base shadow-2xs shrink-0">
                                  {CHOICE_BADGE_ICONS[
                                    idx % CHOICE_BADGE_ICONS.length
                                  ]}
                                </span>
                                <span className="leading-snug">
                                  {cleanChoice}
                                </span>
                              </div>
                              {isPicked && (
                                <CheckCircle2 className="w-5 h-5 text-[#188050] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {selectedSingleChoice && (
                        <div className="rounded-[20px] bg-[#DDF5E8]/65 border border-[#2EC27E]/50 p-3.5 flex items-start gap-3 animate-fadeIn">
                          <BuddyAvatar
                            size="xs"
                            isSpeaking={isSpeaking}
                            mood="celebrating"
                          />
                          <p className="text-xs sm:text-sm font-kids font-bold text-[#188050] leading-relaxed">
                            {toBuddyCompanionUiText(
                              activeExperience.buddyWarmFeedback ||
                                'Tuyệt vời! Lựa chọn của bạn thật ấm áp và ý nghĩa!'
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ==========================================================
                      STEP 3: THỰC HÀNH (PRACTICE) — Section 2.6
                      Focused real-life action card + star reward callout.
                     ========================================================== */}
                  {activeExperience.type === 'practice' && (
                    <div className="rounded-[24px] bg-gradient-to-br from-[#DDF5E8]/80 via-white to-[#FFF9EB] border-2 border-[#2EC27E]/45 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#188050] text-white font-kids font-extrabold text-xs">
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          <span>Hành động nhỏ hôm nay</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF0C9] text-[#8A5A00] font-kids font-extrabold text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>+2 ★</span>
                        </span>
                      </div>

                      <p className="font-kids font-extrabold text-sm sm:text-base text-[#188050] leading-snug">
                        {toBuddyCompanionUiText(
                          activeExperience.actionSuggestion ||
                            activeExperience.title
                        )}
                      </p>

                      <p className="text-xs font-bold text-[#5C6F8C] leading-relaxed">
                        Bạn hãy thử làm việc tốt này cùng ông bà, ba mẹ hoặc bạn bè ngoài đời thực, rồi bấm nút{' '}
                        <span className="text-[#188050] font-extrabold">
                          “Mình làm xong rồi nè!”
                        </span>{' '}
                        bên dưới nhé!
                      </p>
                    </div>
                  )}

                  {/* ==========================================================
                      STEP 4: CHIA SẺ (SHARE) — Section 2.7
                      "Hôm nay bạn cảm thấy thế nào?" + Emotion cards + optional note
                     ========================================================== */}
                  {activeExperience.type === 'share' && (
                    <div className="rounded-[24px] bg-white border border-[#23324D]/8 p-4 space-y-4 shadow-2xs">
                      <div>
                        <p className="font-kids font-extrabold text-sm sm:text-base text-[#23324D] mb-2.5">
                          Hôm nay bạn cảm thấy thế nào?
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {EMOTION_TAGS.map((emo) => {
                            const active = selectedEmotionTag === emo.label;
                            return (
                              <button
                                key={emo.id}
                                type="button"
                                onClick={() =>
                                  setSelectedEmotionTag(active ? '' : emo.label)
                                }
                                className={`min-h-[52px] px-2.5 py-2 rounded-[18px] font-kids font-extrabold text-xs sm:text-sm transition-all cursor-pointer border-2 flex items-center justify-center gap-1.5 ${
                                  active
                                    ? 'bg-[#FFF0C9] border-amber-400 text-[#7A4F00] shadow-2xs scale-[1.02]'
                                    : 'bg-[#F7F9FD] border-[#23324D]/10 text-[#23324D] hover:bg-white hover:border-[#3978F6]/40'
                                }`}
                              >
                                <span className="text-base">{emo.emoji}</span>
                                <span>{emo.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {activeExperience.choices &&
                        activeExperience.choices.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-[#23324D]/8">
                            <p className="text-xs font-kids font-extrabold text-[#5C6F8C]">
                              Chạm chọn điều giống với trải nghiệm của bạn:
                            </p>
                            <div className="space-y-2">
                              {activeExperience.choices.map((rawChoice, idx) => {
                                const cleanChoice =
                                  toBuddyCompanionUiText(rawChoice);
                                const isChecked =
                                  selectedMultiChoices.includes(cleanChoice) ||
                                  selectedMultiChoices.includes(rawChoice);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      handleToggleMultiChoice(cleanChoice)
                                    }
                                    className={`w-full text-left p-3 rounded-[18px] border-2 font-kids font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                      isChecked
                                        ? 'border-[#3978F6] bg-[#EAF3FF]/75 text-[#23324D]'
                                        : 'border-[#23324D]/10 bg-[#F7F9FD] text-[#23324D] hover:bg-white'
                                    }`}
                                  >
                                    <span>{cleanChoice}</span>
                                    {isChecked && (
                                      <CheckCircle2 className="w-4 h-4 text-[#3978F6] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      <div className="pt-1 border-t border-[#23324D]/8">
                        <label className="block text-xs font-kids font-extrabold text-[#5C6F8C] mb-1.5">
                          Kể thêm cho mình nghe nhé (không bắt buộc):
                        </label>
                        <input
                          type="text"
                          value={reflectionInput}
                          onChange={(e) => setReflectionInput(e.target.value)}
                          placeholder="Ví dụ: Hôm nay mình rất vui khi giúp mẹ..."
                          className="w-full px-3.5 py-2.5 rounded-[18px] bg-[#F7F9FD] border border-[#23324D]/15 text-xs sm:text-sm font-semibold text-[#23324D] focus:outline-none focus:border-[#3978F6]"
                        />
                      </div>
                    </div>
                  )}

                  {feedbackNotice && (
                    <div className="bg-[#FFF0C9] border border-amber-300 text-[#7A4F00] px-3.5 py-2.5 rounded-2xl text-xs font-kids font-extrabold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                      <span>{feedbackNotice}</span>
                    </div>
                  )}
                </div>

                {/* ==========================================================
                    STICKY STEP FOOTER — 1 PRIMARY CTA PER STEP
                   ========================================================== */}
                <div className="p-3.5 sm:px-5 bg-white border-t border-[#23324D]/8 shrink-0">
                  {activeExperience.type === 'explore' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteExploreStep(popupTopic, activeExperience)
                      }
                      className="w-full min-h-[48px] px-5 py-3 rounded-[20px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Mình khám phá tiếp!</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {activeExperience.type === 'understand' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteUnderstandStep(
                          popupTopic,
                          activeExperience
                        )
                      }
                      className="w-full min-h-[48px] px-5 py-3 rounded-[20px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Tiếp tục nào!</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {activeExperience.type === 'practice' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCompletePracticeStep(
                            popupTopic,
                            activeExperience
                          )
                        }
                        className="flex-1 min-h-[48px] px-5 py-3 rounded-[20px] bg-[#2EC27E] hover:bg-[#24a86b] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mình làm xong rồi nè!</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF0C9] text-[#8A5A00] text-xs font-extrabold">
                          +2 ★
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleTryLaterStep(popupTopic, activeExperience)
                        }
                        className="min-h-[44px] px-4 py-2 rounded-[18px] bg-[#F7F9FD] hover:bg-[#FFF0C9]/70 text-[#5C6F8C] hover:text-[#8A5A00] font-kids font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mình thử sau nha</span>
                      </button>
                    </div>
                  )}

                  {activeExperience.type === 'share' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCompleteShareStep(popupTopic, activeExperience)
                        }
                        className="flex-1 min-h-[48px] px-5 py-3 rounded-[20px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-sm shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu chia sẻ của mình!</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF0C9] text-[#8A5A00] text-xs font-extrabold">
                          +1 ★
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleTryLaterStep(popupTopic, activeExperience)
                        }
                        className="min-h-[44px] px-4 py-2 rounded-[18px] bg-[#F7F9FD] hover:bg-[#FFF0C9]/70 text-[#5C6F8C] hover:text-[#8A5A00] font-kids font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mình muốn thử lại</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Treasure Chest Summary Modal */}
      {showTreasureModal && (
        <div
          className="fixed inset-0 z-50 bg-[#23324D]/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTreasureModal(false);
          }}
        >
          <div className="w-full max-w-md bg-gradient-to-b from-[#FFF9EB] to-white rounded-[30px] p-5 border-2 border-amber-300 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF0C9] mx-auto flex items-center justify-center text-3xl shadow-xs">
              🏆
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FFF0C9] text-[#8A5A00] font-kids font-extrabold text-xs">
                Đỉnh Núi Kho Báu Phẩm Chất
              </span>
              <h2 className="font-kids font-extrabold text-xl text-[#23324D] mt-2">
                Hành trang tốt đẹp của mình ({data.profile.displayName})
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6F8C] mt-1">
                Bạn đã lưu lại{' '}
                <strong>{totalExperiencedSteps} dấu ấn trải nghiệm</strong> trên
                bản đồ Hành trình của mình!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowTreasureModal(false);
                  openBuddyChat();
                  sendChatMessage(
                    'Buddy ơi, mình vừa mở Rương Kho Báu Phẩm Chất trên bản đồ Hành trình!',
                    'open_journey'
                  );
                }}
                className="min-h-[44px] px-4 py-2 rounded-[18px] bg-[#3978F6] text-white font-kids font-extrabold text-xs cursor-pointer"
              >
                Khoe với Buddy
              </button>
              <button
                type="button"
                onClick={() => setShowTreasureModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-[18px] bg-slate-100 text-[#23324D] font-kids font-extrabold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
