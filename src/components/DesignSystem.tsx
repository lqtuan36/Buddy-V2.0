import React from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  Square,
  Star,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Award,
  Calendar,
} from 'lucide-react';
import { BuddyAvatar } from './BuddyAvatar';
import {
  ACTION_SCENE_REGISTRY,
  TaskCelebrationIllustration,
  TaskStepIllustration,
} from './BuddyIllustrations';
import {
  ChildCharacterVariant,
  Task,
  TaskStep,
  VoiceContextType,
  VoicePreference,
} from '../types/domain';
import {
  voiceService,
  VoicePlaybackState,
  VoiceRuntimeCapabilities,
} from '../services/voiceService';
import { normalizeBuddyCompanionText } from '../services/buddyCompanionLanguage';

/**
 * 1) BuddyMessage Component
 * Clean, child-friendly speech bubble with 18px rounded action buttons.
 */
interface BuddyMessageProps {
  text: string;
  voicePreference: VoicePreference;
  context?: VoiceContextType;
  modeBadge?: 'gemini-live' | 'demo-fallback' | 'safety-guardrail';
  timestamp?: string;
  compact?: boolean;
}

export const BuddyMessage: React.FC<BuddyMessageProps> = ({
  text,
  voicePreference,
  context = 'chat',
  compact = false,
}) => {
  const displayText =
    context === 'story' ? text : normalizeBuddyCompanionText(text);

  const handleListen = () => {
    voiceService.speak(displayText, voicePreference, context);
  };

  return (
    <div className="flex items-start gap-3">
      <BuddyAvatar size={compact ? 'xs' : 'sm'} />
      <div className="flex-1 min-w-0 bg-[#EAF3FF] border border-[#3978F6]/15 rounded-[24px] rounded-tl-md p-3.5 sm:p-4 shadow-[0_6px_18px_rgba(57,120,246,0.06)]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-extrabold font-kids text-[#3978F6]">
            Buddy · Bạn đồng hành
          </span>
          <button
            type="button"
            onClick={handleListen}
            aria-label="Nghe lại lời Buddy"
            className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-[18px] bg-white text-[#3978F6] hover:bg-[#3978F6] hover:text-white text-xs font-kids font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Nghe Buddy đọc"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Nghe lại</span>
          </button>
        </div>
        <p className="font-kids text-sm sm:text-base leading-relaxed text-[#23324D] font-bold break-words">
          {displayText}
        </p>
      </div>
    </div>
  );
};

/**
 * 2) VoiceControl Component
 */
interface VoiceControlProps {
  textToRead: string;
  voicePreference: VoicePreference;
  voiceState: VoicePlaybackState;
  capabilities: VoiceRuntimeCapabilities;
  context?: VoiceContextType;
  onToggleMute?: () => void;
  compact?: boolean;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  textToRead,
  voicePreference,
  voiceState,
  capabilities,
  context = 'chat',
  onToggleMute,
  compact = false,
}) => {
  const isPlayingThis =
    (voiceState.status === 'playing' || voiceState.status === 'paused') &&
    voiceState.lastSpokenText === textToRead.trim();

  const handlePlayOrReplay = () => {
    voiceService.speak(textToRead, voicePreference, context);
  };

  return (
    <div className="rounded-[24px] bg-white border border-[#23324D]/8 p-4 shadow-[0_8px_24px_rgba(35,50,77,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayOrReplay}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-[18px] bg-[#3978F6] text-white font-kids font-bold text-xs sm:text-sm hover:bg-[#2964DF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isPlayingThis ? <RotateCcw className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isPlayingThis ? 'Đọc lại' : 'Nghe Buddy đọc'}</span>
          </button>

          {voiceState.status === 'playing' && (
            <button
              type="button"
              onClick={() => voiceService.pause()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-[18px] bg-[#EAF3FF] text-[#23324D] font-semibold text-xs hover:bg-[#d8e9ff] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Pause className="w-3.5 h-3.5 text-[#3978F6]" />
              <span>Tạm dừng</span>
            </button>
          )}

          {voiceState.status === 'paused' && (
            <button
              type="button"
              onClick={() => voiceService.resume()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-[18px] bg-[#DDF5E8] text-[#23324D] font-semibold text-xs hover:bg-[#c8ecd8] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tiếp tục</span>
            </button>
          )}

          {(voiceState.status === 'playing' || voiceState.status === 'paused') && (
            <button
              type="button"
              onClick={() => voiceService.stop()}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-[18px] bg-[#FFE4D8] text-[#23324D] font-semibold text-xs hover:bg-[#ffd5c2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Square className="w-3.5 h-3.5 text-rose-700" />
              <span>Dừng</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#23324D]/75">
            Giọng <strong>{voicePreference.gender === 'male' ? 'Nam' : 'Nữ'}</strong>
          </span>
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-[18px] bg-[#F7F9FD] border border-[#23324D]/10 text-[#23324D] hover:bg-[#EAF3FF] transition-colors cursor-pointer"
              title={voicePreference.muted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {voicePreference.muted ? (
                <VolumeX className="w-4 h-4 text-rose-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#3978F6]" />
              )}
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-2.5 pt-2.5 border-t border-[#23324D]/8 flex items-center justify-between gap-2 text-[11px] text-[#23324D]/65">
          <span className="truncate">{voiceState.statusMessage || capabilities.voiceAvailabilityNote}</span>
        </div>
      )}
    </div>
  );
};

/**
 * 3) ProgressIndicator Component (Visual Step Progress Bar)
 */
interface ProgressIndicatorProps {
  currentStep: number; // 1-based
  totalSteps: number;
  completedCount: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  completedCount,
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-kids font-extrabold text-[#23324D] tabular-nums">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[18px] bg-[#EAF3FF] text-[#3978F6]">
          <span>Bước {currentStep} / {totalSteps}</span>
        </span>
        <span className="text-[#188050] font-bold">
          Đã hoàn thành {completedCount}/{totalSteps} bước
        </span>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum <= completedCount;
          const isCurrent = stepNum === currentStep;
          return (
            <div
              key={stepNum}
              className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-[#2EC27E]'
                  : isCurrent
                  ? 'bg-[#3978F6] ring-2 ring-[#3978F6]/25'
                  : 'bg-[#EAF3FF]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * 4) StarCounter Component
 */
interface StarCounterProps {
  count: number;
  label?: string;
  onClick?: () => void;
}

export const StarCounter: React.FC<StarCounterProps> = ({
  count,
  label = 'Sao',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-1.5 rounded-[18px] bg-[#FFF0C9] hover:bg-[#ffe7a8] text-[#23324D] font-kids font-extrabold text-sm shadow-2xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
    >
      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
      <span className="tabular-nums">{count}</span>
      <span className="text-xs font-semibold text-[#23324D]/80">{label}</span>
    </button>
  );
};

/**
 * ============================================================================
 * VISUAL ACTION SCENE IMAGE CARD SYSTEM (4 CARD TYPES – v1.4 High Fidelity)
 * 1. TaskCard – Đại diện nhiệm vụ bằng tranh minh họa Warm Storybook lớn
 * 2. StepCard (TaskStepCard) – 1 bước = 1 card = 1 cảnh hành động minh họa lớn
 * 3. HelpCard – Giải thích thêm trực quan khi trẻ chưa hiểu ('help' scene)
 * 4. ResultCard – Chúc mừng giàu hình ảnh + mở Bảng theo dõi tháng ('result' scene)
 * ============================================================================
 */

interface TaskCardProps {
  task: Task;
  isCompletedToday: boolean;
  onSelect: (taskId: string) => void;
}

const THEME_SURFACE_MAP: Record<Task['themeColor'], string> = {
  ice: 'bg-[#EAF3FF]',
  mint: 'bg-[#DDF5E8]',
  yellow: 'bg-[#FFF0C9]',
  peach: 'bg-[#FFE4D8]',
  lavender: 'bg-[#EDE7FF]',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isCompletedToday,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(task.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(task.id);
        }
      }}
      className="group rounded-[28px] bg-white border border-[#23324D]/8 p-4 shadow-[0_10px_28px_rgba(35,50,77,0.06)] hover:shadow-[0_14px_34px_rgba(57,120,246,0.12)] transition-all cursor-pointer flex flex-col justify-between space-y-3.5"
    >
      {/* Top Action Scene Cover Banner */}
      <div className="relative">
        <TaskStepIllustration
          illustrationKey={task.coverIllustration}
          variant="cover"
          showActionCaption={false}
          className="w-full h-44 sm:h-48 rounded-[22px]"
        />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-3 py-1 rounded-[14px] bg-white/95 backdrop-blur-xs text-[#23324D] font-kids font-extrabold text-xs shadow-2xs tabular-nums">
            {task.steps.length} bước tranh
          </span>
          <span className="px-3 py-1 rounded-[14px] bg-[#FFF0C9] text-amber-900 font-kids font-extrabold text-xs shadow-2xs tabular-nums">
            +{task.starReward} ★
          </span>
        </div>

        {isCompletedToday && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-[14px] bg-[#2EC27E] text-white font-kids font-extrabold text-xs shadow-2xs inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã xong hôm nay</span>
          </div>
        )}
      </div>

      {/* Title & Action CTA */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div className="min-w-0 flex-1">
          <h3 className="font-kids text-lg sm:text-xl font-extrabold text-[#23324D] group-hover:text-[#3978F6] transition-colors truncate">
            {task.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#23324D]/70 line-clamp-1 mt-0.5">
            {task.subtitle}
          </p>
        </div>

        <span
          className={`min-h-[44px] px-4 py-2 rounded-[18px] font-kids font-extrabold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0 transition-colors ${
            isCompletedToday
              ? 'bg-[#DDF5E8] text-emerald-900'
              : `${THEME_SURFACE_MAP[task.themeColor]} group-hover:bg-[#3978F6] text-[#23324D] group-hover:text-white`
          }`}
        >
          <span>{isCompletedToday ? 'Xem lại' : 'Bắt đầu'}</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

/**
 * CARD TYPE 3: HelpCard (Visual Action Scene Explanation Card when child clicks "Con chưa hiểu")
 */
interface HelpCardProps {
  stepTitle: string;
  simpleExplanation: string;
  illustrationKey: TaskStep['illustrationKey'];
  onListenHelp: () => void;
  onDismissOrAction?: () => void;
  actionButtonLabel?: string;
}

export const HelpCard: React.FC<HelpCardProps> = ({
  stepTitle,
  simpleExplanation,
  illustrationKey,
  onListenHelp,
  onDismissOrAction,
  actionButtonLabel = 'Mình hiểu rồi, làm tiếp thôi!',
}) => {
  const sceneInfo = ACTION_SCENE_REGISTRY[illustrationKey] || ACTION_SCENE_REGISTRY['pack-books'];
  const safeExplanation = normalizeBuddyCompanionText(simpleExplanation);
  const safeCallout = normalizeBuddyCompanionText(sceneInfo.helpCallout);

  return (
    <div className="rounded-[28px] bg-gradient-to-br from-[#FFF0C9] via-[#FFF9EB] to-[#EAF3FF] border-2 border-amber-300/80 p-4 sm:p-5 shadow-[0_12px_30px_rgba(245,158,11,0.12)] space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <BuddyAvatar size="sm" mood="happy" />
          <div className="min-w-0">
            <span className="text-[11px] font-kids font-extrabold text-amber-800 block">
              Gợi ý trực quan của Buddy
            </span>
            <h3 className="font-kids text-base sm:text-lg font-extrabold text-[#23324D] break-words">
              Cách làm dễ nhất: {stepTitle}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onListenHelp}
          className="min-h-[42px] px-3.5 py-2 rounded-[18px] bg-white hover:bg-[#3978F6] text-[#3978F6] hover:text-white font-kids font-extrabold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          <span>Nghe lại</span>
        </button>
      </div>

      {/* Annotated Help Action Scene */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/95 rounded-[22px] p-3.5 border border-amber-200/70">
        <div className="sm:col-span-6">
          <TaskStepIllustration
            illustrationKey={illustrationKey}
            variant="help"
            showActionCaption={false}
            className="w-full h-44 rounded-[18px]"
          />
        </div>
        <div className="sm:col-span-6 space-y-2.5 text-left">
          <p className="font-kids font-bold text-sm sm:text-base text-[#23324D] leading-relaxed">
            “{safeExplanation}”
          </p>
          <div className="rounded-[16px] bg-[#EAF3FF]/85 px-3.5 py-2.5 text-xs font-kids font-bold text-[#3978F6]">
            💡 Mẹo nhỏ: {safeCallout}
          </div>
        </div>
      </div>

      {onDismissOrAction && (
        <button
          type="button"
          onClick={onDismissOrAction}
          className="w-full min-h-[48px] px-5 py-3 rounded-[18px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-sm shadow-2xs transition-colors cursor-pointer"
        >
          {actionButtonLabel}
        </button>
      )}
    </div>
  );
};

export type StepRunnerFlowPhase =
  | 'speaking'
  | 'countdown'
  | 'paused_blocked'
  | 'ready_final';

/**
 * CARD TYPE 2: StepCard / TaskStepCard (Voice-Guided Action Scene Card with 10s Post-Speech Countdown)
 * - Speaks concise step title first ("Bước X: ...") without reading subtitle/description by default.
 * - Starts 10-second countdown ONLY after voice finishes speaking.
 * - Auto-advances to next step on intermediate steps (no "Con làm xong rồi" or "Tiếp theo" buttons).
 * - Shows "Nghe lại", "Con chưa hiểu", "Bước trước" during countdown.
 * - On the final step, displays ONE primary CTA: "Con đã hoàn thành nhiệm vụ".
 */
interface TaskStepCardProps {
  step: TaskStep;
  stepIndex: number;
  totalSteps: number;
  completedCount?: number;
  isStepCompleted: boolean;
  isSubmitting?: boolean;
  showSimpleHint: boolean;
  countdownSeconds?: number;
  flowPhase?: StepRunnerFlowPhase;
  onCompleteStep: () => void;
  onNeedHelp: () => void;
  onRepeatAudio: () => void;
  onPrevStep: () => void;
}

export const TaskStepCard: React.FC<TaskStepCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  completedCount = 0,
  isSubmitting = false,
  showSimpleHint,
  countdownSeconds = 10,
  flowPhase = 'countdown',
  onCompleteStep,
  onNeedHelp,
  onRepeatAudio,
  onPrevStep,
}) => {
  const cleanActionTitle = step.actionTitle.replace(/^Bước\s*\d+\s*[:.-]\s*/i, '').trim();
  const isFinalStep = stepIndex >= totalSteps - 1;
  const safeCountdown = Math.max(0, Math.min(10, countdownSeconds));
  const progressPercent = Math.round((safeCountdown / 10) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-[32px] bg-white border border-[#23324D]/8 p-4 sm:p-6 shadow-[0_14px_38px_rgba(35,50,77,0.07)] space-y-4 sm:space-y-5">
        {/* 1. Embedded Progress Header inside Step Card */}
        <ProgressIndicator
          currentStep={stepIndex + 1}
          totalSteps={totalSteps}
          completedCount={completedCount}
        />

        {/* 2. Large Warm Storybook Action Scene Illustration */}
        <div className="relative">
          <TaskStepIllustration
            illustrationKey={step.illustrationKey}
            variant="step"
            className="w-full h-60 sm:h-72 rounded-[24px]"
            showActionCaption={false}
          />
        </div>

        {/* 3. Step Number & Concise Action Title ONLY (No default description/subtitle) */}
        <div className="text-center space-y-1 px-2">
          <span className="inline-block text-xs font-kids font-extrabold text-[#3978F6]">
            Bước {stepIndex + 1} / {totalSteps}
          </span>
          <h2 className="font-kids text-xl sm:text-2xl font-extrabold text-[#23324D] leading-snug">
            Bước {stepIndex + 1}: {cleanActionTitle}
          </h2>
        </div>

        {/* 4. Friendly Voice & 10-Second Practice Countdown Status Bar */}
        <div className="rounded-[22px] bg-[#F7F9FD] border border-[#3978F6]/18 p-3.5 sm:p-4 space-y-2.5">
          {flowPhase === 'speaking' && (
            <div className="flex items-center justify-center gap-2.5 text-[#3978F6] font-kids font-extrabold text-xs sm:text-sm py-1">
              <Volume2 className="w-4 h-4 shrink-0 motion-safe:animate-pulse" />
              <span>Mình đang đọc hướng dẫn Bước {stepIndex + 1}...</span>
            </div>
          )}

          {flowPhase === 'paused_blocked' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
              <span className="text-xs font-kids font-bold text-amber-800">
                Âm thanh đang tạm dừng. Bạn chạm nút bên cạnh để nghe mình đọc Bước {stepIndex + 1} nhé!
              </span>
              <button
                type="button"
                onClick={onRepeatAudio}
                className="min-h-[42px] px-4 py-2 rounded-[16px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <Volume2 className="w-4 h-4" />
                <span>Thử phát lại</span>
              </button>
            </div>
          )}

          {(flowPhase === 'countdown' || flowPhase === 'ready_final') && (
            <>
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-kids font-extrabold">
                <span className="text-[#23324D]">
                  {flowPhase === 'ready_final' && isFinalStep
                    ? '✨ Bạn đã thực hành xong tất cả các bước!'
                    : '⏱️ Thời gian bạn tự thực hành:'}
                </span>
                {!(flowPhase === 'ready_final' && isFinalStep) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EAF3FF] text-[#3978F6] tabular-nums">
                    {safeCountdown} giây
                  </span>
                )}
              </div>

              {!(flowPhase === 'ready_final' && isFinalStep) && (
                <div className="w-full h-2.5 rounded-full bg-[#EAF3FF] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3978F6] to-[#2EC27E] transition-all duration-700 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              <p className="text-[11px] sm:text-xs font-semibold text-[#5C6F8C] text-center">
                {isFinalStep
                  ? 'Khi làm xong bước cuối này, bạn bấm nút hoàn thành nhiệm vụ bên dưới nhé!'
                  : `Hết ${safeCountdown} giây mình sẽ cùng chuyển sang Bước ${stepIndex + 2}.`}
              </p>
            </>
          )}
        </div>

        {/* 5. Helper Controls ("Nghe lại", "Mình chưa hiểu", "Bước trước") + Final Step Single CTA */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onRepeatAudio}
              disabled={isSubmitting}
              className="min-h-[46px] px-2.5 sm:px-3.5 py-2 rounded-[18px] bg-[#EAF3FF] hover:bg-[#d8e8ff] disabled:opacity-45 text-[#3978F6] font-kids font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Nghe lại</span>
            </button>

            <button
              type="button"
              onClick={onNeedHelp}
              disabled={isSubmitting}
              className="min-h-[46px] px-2.5 sm:px-3.5 py-2 rounded-[18px] bg-[#FFF0C9] hover:bg-[#ffe5a3] disabled:opacity-45 text-[#23324D] font-kids font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Mình chưa hiểu</span>
            </button>

            <button
              type="button"
              onClick={onPrevStep}
              disabled={stepIndex === 0 || isSubmitting}
              className="min-h-[46px] px-2.5 sm:px-3.5 py-2 rounded-[18px] text-xs sm:text-sm font-kids font-bold text-[#23324D]/85 bg-[#F7F9FD] hover:bg-[#EAF3FF] border border-[#23324D]/10 disabled:opacity-35 disabled:pointer-events-none inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <span>← Bước trước</span>
            </button>
          </div>

          {isFinalStep && (
            <button
              type="button"
              onClick={onCompleteStep}
              disabled={isSubmitting}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-[18px] bg-[#2EC27E] hover:bg-[#24a86b] disabled:opacity-60 disabled:pointer-events-none text-white font-kids font-extrabold text-base sm:text-lg shadow-[0_10px_24px_rgba(46,194,126,0.28)] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                {isSubmitting ? 'Đang lưu nhiệm vụ...' : 'Mình đã hoàn thành nhiệm vụ'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Visual HelpCard when child clicks "Con chưa hiểu" */}
      {showSimpleHint && (
        <HelpCard
          stepTitle={cleanActionTitle}
          simpleExplanation={step.simpleExplanation}
          illustrationKey={step.illustrationKey}
          onListenHelp={onNeedHelp}
        />
      )}
    </div>
  );
};

/**
 * CARD TYPE 4: ResultCard (Unified Warm Storybook Celebration Artwork + Effort Praise)
 * - Displays ONE unified Warm Storybook celebration illustration (boy/girl variant matched to profile.characterVariant)
 * - Gentle celebration/confetti overlay on the artwork (prefers-reduced-motion compliant)
 * - Does NOT display Buddy icon + 2 side-by-side step images, and does NOT display the 5-step preview strip again.
 */
interface ResultCardProps {
  task: Task;
  childName: string;
  characterVariant?: ChildCharacterVariant;
  awarded: boolean;
  starsAdded: number;
  message: string;
  onReplayPraise: () => void;
  onOpenMonthlyTracker: () => void;
  onGoHome: () => void;
  onMoreActivities: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  task,
  childName,
  characterVariant,
  awarded,
  starsAdded,
  message,
  onReplayPraise,
  onOpenMonthlyTracker,
  onGoHome,
  onMoreActivities,
}) => {
  return (
    <div className="rounded-[32px] bg-gradient-to-b from-[#FFF0C9] via-white to-[#DDF5E8] border-2 border-amber-300/70 p-5 sm:p-6 text-center space-y-5 shadow-[0_14px_38px_rgba(245,158,11,0.14)]">
      {/* Top Star Effort Award Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[18px] bg-white text-amber-800 font-kids font-extrabold text-xs sm:text-sm shadow-2xs border border-amber-200/80">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {awarded
              ? `Hoan hô! Thưởng +${starsAdded} Ngôi sao nỗ lực!`
              : 'Hoan hô! Đã hoàn thành xuất sắc!'}
          </span>
        </div>
      </div>

      {/* Single Unified Warm Storybook Celebration Artwork with Gentle Confetti Overlay */}
      <div className="max-w-lg mx-auto">
        <TaskCelebrationIllustration
          characterVariant={characterVariant}
          className="w-full h-56 sm:h-68 rounded-[26px]"
        />
      </div>

      <div className="space-y-1.5 px-1">
        <h2 className="font-kids text-xl sm:text-2xl font-extrabold text-[#23324D] leading-snug">
          Tuyệt quá, {childName} đã hoàn thành “{task.title}”!
        </h2>
        <p className="text-sm sm:text-base text-[#23324D]/85 leading-relaxed max-w-md mx-auto">
          {normalizeBuddyCompanionText(message, childName)}
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onOpenMonthlyTracker}
          className="w-full min-h-[52px] px-6 py-3 rounded-[18px] bg-[#2EC27E] hover:bg-[#24a86b] text-white font-kids font-extrabold text-sm sm:text-base shadow-[0_8px_20px_rgba(46,194,126,0.28)] inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
        >
          <Calendar className="w-5 h-5 shrink-0" />
          <span>Xem bảng theo dõi tháng</span>
        </button>

        <button
          type="button"
          onClick={onReplayPraise}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-[18px] bg-[#EAF3FF] hover:bg-[#d8e9ff] text-[#3978F6] font-kids font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>Nghe lại lời khen của Buddy</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="min-h-[48px] px-4 py-2.5 rounded-[18px] bg-[#3978F6] hover:bg-[#2964DF] text-white font-kids font-extrabold text-xs sm:text-sm shadow-2xs cursor-pointer"
          >
            Về Trang chủ
          </button>

          <button
            type="button"
            onClick={onMoreActivities}
            className="min-h-[48px] px-4 py-2.5 rounded-[18px] bg-white hover:bg-[#EAF3FF] text-[#23324D] border border-[#23324D]/10 font-kids font-bold text-xs sm:text-sm cursor-pointer"
          >
            Nhiệm vụ khác
          </button>
        </div>
      </div>
    </div>
  );
};
