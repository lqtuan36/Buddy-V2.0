import {
  FemaleVoiceId,
  VoiceContextType,
  VoiceGender,
  VoicePreference,
  VoiceStyleMode,
} from '../types/domain';
import { toBuddyCompanionVoiceText } from './buddyCompanionLanguage';

export type VoiceEngineMode =
  | 'gemini-server-tts'
  | 'browser-speech-synthesis'
  | 'text-fallback';

/**
 * Part I.1 – Mandatory Weighted Voice Quality Evaluation Hierarchy
 */
export const VOICE_QUALITY_EVALUATION_CRITERIA = [
  {
    priority: 1,
    weightPercent: 40,
    title: 'Phát âm tiếng Việt chính xác (40%)',
    description:
      'Rõ âm đầu, âm chính, âm cuối; giữ đúng dấu thanh tiếng Việt; xử lý tự nhiên tên riêng, chữ số và từ viết tắt.',
  },
  {
    priority: 2,
    weightPercent: 30,
    title: 'Ngữ điệu và nhịp nói (30%)',
    description:
      'Ngắt nghỉ đúng nghĩa câu, nhấn nhẹ từ quan trọng, thay đổi cảm xúc vừa phải, không đọc đều đều máy móc.',
  },
  {
    priority: 3,
    weightPercent: 20,
    title: 'Độ rõ chữ khi nghe liên tục (20%)',
    description:
      'Trẻ 6–8 tuổi nghe dễ hiểu ở tốc độ bình thường, không gây mệt tai khi nghe câu chuyện 1–3 phút.',
  },
  {
    priority: 4,
    weightPercent: 10,
    title: 'Màu giọng thân thiện đồng hành (10%)',
    description:
      'Ấm áp, tươi sáng, xưng mình – gọi bạn tự nhiên như người bạn nhỏ đáng tin cậy.',
  },
] as const;

/**
 * Part VI.2 – Built-in Vietnamese Pronunciation & 3-Mode Voice Test Suite
 */
export interface VietnameseVoiceTestCase {
  id: string;
  groupLabel: string;
  mode: VoiceStyleMode;
  context: VoiceContextType;
  title: string;
  sampleText: string;
  focusWords: string[];
}

export const VIETNAMESE_VOICE_TEST_SUITE: VietnameseVoiceTestCase[] = [
  {
    id: 'test-pronunciation-tones',
    groupLabel: 'Nhóm 1 · Phát âm & Dấu thanh (40%)',
    mode: 'companion',
    context: 'guide',
    title: 'Từ dễ phát âm sai & thanh hỏi/ngã',
    sampleText:
      'Bạn ơi, mình cùng đọc rõ từng từ nhé: quyển truyện, dũng cảm, nghĩ ngợi, ngã xuống, uống sữa, giữ gìn, nói lời cảm ơn và chuẩn bị cặp sách gọn gàng!',
    focusWords: [
      'quyển truyện',
      'dũng cảm',
      'nghĩ ngợi',
      'ngã xuống',
      'sữa',
      'giữ gìn',
      'cảm ơn',
      'chuẩn bị cặp sách',
    ],
  },
  {
    id: 'test-mode-companion',
    groupLabel: 'Nhóm 2 · Mode 1 – Companion (Hướng dẫn)',
    mode: 'companion',
    context: 'guide',
    title: 'Câu hướng dẫn ngắn cho trẻ 6–8 tuổi',
    sampleText:
      'Bạn ơi! Mình cùng nhìn lên bàn học xem những chiếc bút đang nằm ở đâu nhé. Bạn gom từng chiếc bút rồi cắm gọn vào ống đựng nào!',
    focusWords: ['nhìn lên bàn học', 'gom từng chiếc bút', 'ống đựng'],
  },
  {
    id: 'test-mode-storytelling',
    groupLabel: 'Nhóm 3 · Mode 2 – Storytelling (Kể chuyện)',
    mode: 'storytelling',
    context: 'story',
    title: 'Đoạn kể chuyện giàu cảm xúc trước giờ ngủ',
    sampleText:
      'Chiều hôm ấy, chú sẻ nhỏ đứng dưới mái hiên nghe tiếng mưa rơi tí tách. Chú nghĩ ngợi một lát rồi dũng cảm vỗ cánh bay về phía tổ ấm trên cành cây cao, nơi mẹ đang dịu dàng chờ đón.',
    focusWords: ['mưa rơi tí tách', 'nghĩ ngợi', 'dũng cảm vỗ cánh', 'dịu dàng'],
  },
  {
    id: 'test-mode-celebration',
    groupLabel: 'Nhóm 4 · Mode 3 – Celebration (Chúc mừng)',
    mode: 'celebration',
    context: 'celebration',
    title: 'Lời khen ngợi khi hoàn thành nhiệm vụ',
    sampleText:
      'Hoan hô! Góc học tập của bạn đã gọn gàng và sáng bừng lên rồi. Mình đập tay ăn mừng chiến thắng nhỏ hôm nay nhé!',
    focusWords: ['Hoan hô', 'gọn gàng', 'sáng bừng', 'ăn mừng'],
  },
];

/**
 * UnifiedVoiceService State Machine:
 * Supports 'idle' | 'loading' | 'speaking' | 'playing' | 'paused' | 'error'
 * ('playing' is kept synchronized with 'speaking' for backward compatibility across views)
 */
export type VoicePlaybackStatus =
  | 'idle'
  | 'loading'
  | 'speaking'
  | 'playing'
  | 'paused'
  | 'error';

export interface VoicePlaybackState {
  status: VoicePlaybackStatus;
  activeEngine: VoiceEngineMode;
  activeGender: VoiceGender;
  activeVoiceId?: 'Puck' | 'Leda' | 'Zephyr' | string;
  lastSpokenText: string;
  currentUtteranceId: string | null;
  statusMessage: string;
  autoplayBlocked?: boolean;
  isUsingFallback?: boolean;
  activeAudioSourceLabel?: string;
  lastErrorType?: 'autoplay_blocked' | 'abort_error' | 'network_or_api_error' | null;
}

export interface VoiceRuntimeCapabilities {
  geminiTtsAvailable: boolean;
  browserSpeechAvailable: boolean;
  vietnameseVoicesCount: number;
  maleVietnameseVoiceFound: boolean;
  femaleVietnameseVoiceFound: boolean;
  voiceAvailabilityNote: string;
}

type VoiceSubscriber = (
  state: VoicePlaybackState,
  capabilities: VoiceRuntimeCapabilities
) => void;

// 44-byte 1-sample silent PCM WAV data URI used to unlock the single shared HTMLAudioElement inside a user click gesture
const SILENT_UNLOCK_WAV_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Part VI.1 – Vietnamese Text Preprocessor before sending to Gemini TTS.
 * Strips Markdown/HTML, expands abbreviations & measurement units, normalizes pauses,
 * and preserves 100% of Vietnamese tone marks and proper names.
 */
export function normalizeVietnameseTextForTts(rawText: string): string {
  if (!rawText) return '';
  return (
    rawText
      .replace(/<[^>]+>/g, ' ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/★/g, ' ngôi sao ')
      .replace(/\+\s*(\d+)\s*ngôi sao/gi, 'cộng $1 ngôi sao')
      .replace(/\+\s*(\d+)/g, 'cộng $1 ')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 trên $2')
      .replace(/(\d+)\s*%/g, '$1 phần trăm')
      .replace(/\bTKB\b/g, 'thời khóa biểu')
      .replace(/\bCLB\b/g, 'câu lạc bộ')
      .replace(/\bSGK\b/g, 'sách giáo khoa')
      .replace(/\bVD\s*:/gi, 'Ví dụ:')
      .replace(/\bTP\.\s*/g, 'Thành phố ')
      .replace(/\bGV\b/g, 'giáo viên')
      .replace(/\bHS\b/g, 'học sinh')
      .replace(/\bBT\b/g, 'bài tập')
      .replace(/\bAI\b/g, 'ây ai')
      .replace(/(\d+)\s*kg\b/gi, '$1 ki-lô-gam')
      .replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét')
      .replace(/(\d+)\s*mm\b/gi, '$1 mi-li-mét')
      .replace(/(\d+)\s*km\b/gi, '$1 ki-lô-mét')
      .replace(/(\d+)\s*ml\b/gi, '$1 mi-li-lít')
      .replace(/(\d+)\s*m\b/gi, '$1 mét')
      .replace(/(\d+)\s*g\b/gi, '$1 gam')
      .replace(/(\d+)\s*l\b/gi, '$1 lít')
      .replace(/[•·]/g, ', ')
      .replace(/[→⇒—–]/g, ', ')
      .replace(/\.{2,}|…+/g, '. ')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .replace(/\s+([,.;!?])/g, '$1')
      .replace(/([,.;!?])(?=[A-Za-zÀ-ỹ])/g, '$1 ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function createWavBlobFromPcm(
  pcmBytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Blob {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBytes.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmTarget = new Uint8Array(buffer, 44);
  pcmTarget.set(pcmBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

class UnifiedVoiceService {
  // Single persistent HTMLAudioElement reused across the entire session (prevents multiple audio instances & preserves gesture unlock)
  private sharedAudioElement: HTMLAudioElement | null = null;
  private isAudioUnlocked = false;
  private activeObjectUrl: string | null = null;
  private currentAbortController: AbortController | null = null;
  private activeSpeechUtterance: SpeechSynthesisUtterance | null = null;
  private subscribers: Set<VoiceSubscriber> = new Set();
  private lastPref: VoicePreference | null = null;
  private lastContext: VoiceContextType = 'chat';
  private activeUtteranceToken = 0;
  private lastRequestSignature = '';
  private lastRequestTimestamp = 0;

  private state: VoicePlaybackState = {
    status: 'idle',
    activeEngine: 'gemini-server-tts',
    activeGender: 'female',
    lastSpokenText: '',
    currentUtteranceId: null,
    statusMessage: 'Sẵn sàng phát giọng nói của Buddy.',
    autoplayBlocked: false,
    lastErrorType: null,
  };

  private capabilities: VoiceRuntimeCapabilities = {
    geminiTtsAvailable: true,
    browserSpeechAvailable:
      typeof window !== 'undefined' && 'speechSynthesis' in window,
    vietnameseVoicesCount: 0,
    maleVietnameseVoiceFound: false,
    femaleVietnameseVoiceFound: false,
    voiceAvailabilityNote:
      'Đang dùng giọng AI Gemini tiếng Việt: Zephyr · Cô bạn ấm áp, vui tươi (Nữ) & Puck · Cậu bạn hoạt bát (Nam).',
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.inspectBrowserVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.inspectBrowserVoices();
          this.notify();
        };
      } catch {
        // Ignore initialization errors on restricted webviews
      }
    }
  }

  /**
   * Returns the single shared HTMLAudioElement instance for this browser session.
   * Never creates duplicate Audio elements.
   */
  private getOrCreateAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return null;
    }
    if (!this.sharedAudioElement) {
      const el = new Audio();
      el.preload = 'auto';
      el.setAttribute('playsinline', 'true');
      this.sharedAudioElement = el;
    }
    return this.sharedAudioElement;
  }

  /**
   * Synchronously unlocks the single shared HTMLAudioElement inside a direct user click/tap gesture
   * (e.g., when clicking "Bắt đầu", "Mở thẻ", "Nghe Buddy nói", "Nghe lại", or advancing a step).
   * This satisfies desktop & mobile browser autoplay policies so the subsequent async `/api/tts` response
   * can call `sharedAudioElement.play()` without throwing `NotAllowedError`.
   */
  public unlockAudioFromUserGesture(): void {
    this.clearAutoplayBlocked();
    const audio = this.getOrCreateAudioElement();
    if (!audio) return;

    // Do not interrupt if the shared element is already actively playing a real speech utterance
    if (
      this.isAudioUnlocked ||
      ((this.state.status === 'playing' || this.state.status === 'speaking') &&
        !audio.paused)
    ) {
      return;
    }

    try {
      const prevVolume = audio.volume;
      audio.muted = false;
      audio.volume = 0.01;
      audio.src = SILENT_UNLOCK_WAV_URI;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            this.isAudioUnlocked = true;
            // Only pause if a real TTS blob hasn't replaced `audio.src` in the meantime
            if (audio.src === SILENT_UNLOCK_WAV_URI) {
              try {
                audio.pause();
                audio.currentTime = 0;
              } catch {
                // ignore
              }
            }
            audio.volume = prevVolume > 0.01 ? prevVolume : 1;
          })
          .catch(() => {
            audio.volume = prevVolume > 0.01 ? prevVolume : 1;
          });
      }
    } catch {
      // Ignore synchronous unlock errors
    }
  }

  public setGeminiTtsAvailable(available: boolean): void {
    this.capabilities.geminiTtsAvailable = available;
    this.updateCapabilityNote();
    this.notify();
  }

  /**
   * Live-updates volume, mute, and playbackRate on the shared audio element without restarting speech.
   */
  public syncLivePreference(preference: VoicePreference): void {
    this.lastPref = preference;
    if (preference.muted || preference.volume <= 0) {
      this.cancel();
      return;
    }
    if (this.sharedAudioElement) {
      try {
        this.sharedAudioElement.volume = Math.max(0, Math.min(1, preference.volume));
        this.sharedAudioElement.playbackRate = Math.max(
          0.75,
          Math.min(1.25, preference.speechRate || 1.0)
        );
      } catch {
        // Ignore audio element live update error
      }
    }
  }

  private inspectBrowserVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.capabilities.browserSpeechAvailable = false;
      this.updateCapabilityNote();
      return;
    }

    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const viVoices = voices.filter((v) =>
        (v.lang || '').toLowerCase().startsWith('vi')
      );

      this.capabilities.vietnameseVoicesCount = viVoices.length;
      this.capabilities.maleVietnameseVoiceFound = viVoices.some((v) =>
        /nam|male|minh|an|quang|hieu|phuc/i.test(v.name)
      );
      this.capabilities.femaleVietnameseVoiceFound = viVoices.some((v) =>
        /nu|nữ|female|linh|mai|lan|hoai|my|vy/i.test(v.name)
      );
    } catch {
      this.capabilities.vietnameseVoicesCount = 0;
    }
    this.updateCapabilityNote();
  }

  private updateCapabilityNote(): void {
    if (this.state.isUsingFallback && this.state.activeAudioSourceLabel) {
      this.capabilities.voiceAvailabilityNote = `Đang phát qua nguồn dự phòng: ${this.state.activeAudioSourceLabel} (khi hạn mức Gemini TTS tạm đầy).`;
      return;
    }

    if (this.capabilities.geminiTtsAvailable) {
      const femVoice: FemaleVoiceId = this.lastPref?.femaleVoiceId || 'Leda';
      this.capabilities.voiceAvailabilityNote = `Đang dùng giọng AI Gemini tiếng Việt: ${femVoice} · Cô bạn dịu dàng, tươi sáng (Nữ) & Puck · Cậu bạn hoạt bát (Nam).`;
      return;
    }

    if (!this.capabilities.browserSpeechAvailable) {
      this.capabilities.voiceAvailabilityNote =
        'Thiết bị chưa hỗ trợ Web Speech API. Buddy sẽ phát giọng đọc từ máy chủ hoặc hiển thị lời thoại bằng chữ rõ ràng.';
      return;
    }

    if (this.capabilities.vietnameseVoicesCount === 0) {
      this.capabilities.voiceAvailabilityNote =
        'Đang kết nối giọng đọc tiếng Việt trên máy chủ (Zephyr / Puck).';
      return;
    }

    if (this.capabilities.vietnameseVoicesCount >= 2) {
      this.capabilities.voiceAvailabilityNote = `Trình duyệt có ${this.capabilities.vietnameseVoicesCount} giọng đọc tiếng Việt (vi-VN) cho Giọng Nam và Giọng Nữ.`;
    } else {
      this.capabilities.voiceAvailabilityNote =
        'Trình duyệt có 1 giọng đọc tiếng Việt (vi-VN). Buddy điều chỉnh tốc độ & cao độ nhẹ nhàng cho Giọng Nam/Nữ.';
    }
  }

  public subscribe(fn: VoiceSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.state, this.capabilities);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  private notify(): void {
    for (const fn of this.subscribers) {
      fn({ ...this.state }, { ...this.capabilities });
    }
  }

  private detachAndCancelBrowserSpeech(): void {
    if (this.activeSpeechUtterance) {
      try {
        this.activeSpeechUtterance.onstart = null;
        this.activeSpeechUtterance.onend = null;
        this.activeSpeechUtterance.onerror = null;
      } catch {
        // Ignore handler detachment errors
      }
      this.activeSpeechUtterance = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore browser cancel errors
      }
    }
  }

  /**
   * Stops any in-flight request or active playback on the single shared HTMLAudioElement
   * without destroying the shared element instance (preserving its user-gesture unlock state).
   */
  private cleanupAudioResources(): void {
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {
        // Ignore abort errors
      }
      this.currentAbortController = null;
    }

    if (this.sharedAudioElement) {
      try {
        this.sharedAudioElement.onplay = null;
        this.sharedAudioElement.onended = null;
        this.sharedAudioElement.onerror = null;
        if (
          !this.sharedAudioElement.paused &&
          this.sharedAudioElement.src !== SILENT_UNLOCK_WAV_URI
        ) {
          this.sharedAudioElement.pause();
        }
        if (this.sharedAudioElement.src !== SILENT_UNLOCK_WAV_URI) {
          this.sharedAudioElement.currentTime = 0;
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    if (this.activeObjectUrl) {
      try {
        URL.revokeObjectURL(this.activeObjectUrl);
      } catch {
        // Ignore URL revoke errors
      }
      this.activeObjectUrl = null;
    }

    this.detachAndCancelBrowserSpeech();
  }

  /**
   * Cancels any active audio or speechSynthesis playback immediately.
   * Prevents overlapping voices when switching tabs, closing modals, or tapping a new speaker button.
   */
  public cancel(): void {
    this.activeUtteranceToken += 1;
    this.lastRequestSignature = '';
    this.lastRequestTimestamp = 0;
    this.cleanupAudioResources();

    if (this.state.status !== 'idle') {
      this.state = {
        ...this.state,
        status: 'idle',
        currentUtteranceId: null,
        statusMessage: 'Đã dừng phát âm thanh.',
      };
      this.notify();
    }
  }

  public stop(): void {
    this.cancel();
  }

  public pause(): void {
    if (this.sharedAudioElement && !this.sharedAudioElement.paused) {
      try {
        this.sharedAudioElement.pause();
        this.state = {
          ...this.state,
          status: 'paused',
          statusMessage: 'Đã tạm dừng giọng đọc của Buddy.',
        };
        this.notify();
        return;
      } catch {
        // Fall through
      }
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.speaking
    ) {
      try {
        window.speechSynthesis.pause();
        this.state = {
          ...this.state,
          status: 'paused',
          statusMessage: 'Đã tạm dừng giọng đọc của Buddy.',
        };
        this.notify();
      } catch {
        // Ignore pause error
      }
    }
  }

  public resume(): void {
    if (
      this.sharedAudioElement &&
      this.sharedAudioElement.paused &&
      this.state.status === 'paused'
    ) {
      this.sharedAudioElement
        .play()
        .then(() => {
          this.isAudioUnlocked = true;
          this.state = {
            ...this.state,
            status: 'playing',
            statusMessage: 'Buddy đang tiếp tục đọc...',
          };
          this.notify();
        })
        .catch(() => {
          // Ignore resume error
        });
      return;
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.paused
    ) {
      try {
        window.speechSynthesis.resume();
        this.state = {
          ...this.state,
          status: 'playing',
          statusMessage: 'Buddy đang tiếp tục đọc...',
        };
        this.notify();
      } catch {
        // Ignore resume error
      }
    }
  }

  public clearAutoplayBlocked(): void {
    if (this.state.autoplayBlocked || this.state.lastErrorType) {
      this.state = {
        ...this.state,
        autoplayBlocked: false,
        lastErrorType: null,
      };
      this.notify();
    }
  }

  public async replayLast(): Promise<void> {
    if (!this.state.lastSpokenText || !this.lastPref) return;
    this.unlockAudioFromUserGesture();
    await this.speak(
      this.state.lastSpokenText,
      { ...this.lastPref, muted: false },
      this.lastContext
    );
  }

  public async speak(
    text: string,
    preference: VoicePreference,
    context: VoiceContextType = 'chat',
    onEnded?: () => void
  ): Promise<{
    ok: boolean;
    autoplayBlocked?: boolean;
    superseded?: boolean;
    errorType?: 'autoplay_blocked' | 'abort_error' | 'network_or_api_error';
  }> {
    const rawCleanText = text.trim();
    if (!rawCleanText) return { ok: false };

    // Apply companion "mình - bạn" language normalization ONLY for non-story Buddy utterances
    const cleanText = toBuddyCompanionVoiceText(rawCleanText, context);

    const targetFemaleVoice: FemaleVoiceId = preference.femaleVoiceId || 'Leda';
    const targetVoiceName = preference.gender === 'male' ? 'Puck' : targetFemaleVoice;

    // Duplicate-request lock: if the exact same text & voice was triggered within 450ms and is already loading/playing, ignore duplicate tap
    const now = Date.now();
    const signature = `${preference.gender}:${targetVoiceName}:${context}:${cleanText}`;
    if (
      signature === this.lastRequestSignature &&
      now - this.lastRequestTimestamp < 450 &&
      (this.state.status === 'loading' ||
        this.state.status === 'playing' ||
        this.state.status === 'speaking')
    ) {
      return { ok: false, superseded: true };
    }
    this.lastRequestSignature = signature;
    this.lastRequestTimestamp = now;

    this.lastPref = preference;
    this.lastContext = context;

    // 1. Always cancel any active playback before starting new utterance (Single-Source Guarantee)
    this.cleanupAudioResources();
    this.activeUtteranceToken += 1;
    const token = this.activeUtteranceToken;
    const utteranceId = `utt-${now}-${token}`;
    const normalizedText = normalizeVietnameseTextForTts(cleanText);

    if (preference.muted || preference.volume <= 0) {
      this.state = {
        status: 'idle',
        activeEngine: 'text-fallback',
        activeGender: preference.gender,
        activeVoiceId: targetVoiceName,
        lastSpokenText: cleanText,
        currentUtteranceId: null,
        statusMessage: 'Đang tắt âm thanh (Chế độ đọc chữ).',
        autoplayBlocked: false,
        lastErrorType: null,
      };
      this.notify();
      if (onEnded) onEnded();
      return { ok: true };
    }

    // 2. Primary Path: Server-side TTS (/api/tts with Gemini Puck / Leda / Zephyr + server WAV fallback)
    if (preference.preferServerTts !== false) {
      this.state = {
        status: 'loading',
        activeEngine: 'gemini-server-tts',
        activeGender: preference.gender,
        activeVoiceId: targetVoiceName,
        lastSpokenText: cleanText,
        currentUtteranceId: utteranceId,
        statusMessage: `Đang chuẩn bị giọng ${
          preference.gender === 'male' ? 'Nam (Puck)' : `Nữ (${targetFemaleVoice})`
        } của Buddy...`,
        autoplayBlocked: false,
        lastErrorType: null,
      };
      this.notify();

      const abortController = new AbortController();
      this.currentAbortController = abortController;

      const geminiResult = await this.tryPlayGeminiServerTts(
        normalizedText,
        preference,
        context,
        token,
        utteranceId,
        abortController.signal
      );

      // If another utterance superseded this one while loading/playing, stop here and NEVER fall back to browser speech
      if (token !== this.activeUtteranceToken || geminiResult === 'superseded') {
        return { ok: false, superseded: true };
      }

      if (geminiResult === 'played') {
        if (token === this.activeUtteranceToken && onEnded) {
          onEnded();
        }
        return { ok: true };
      }

      // If Gemini audio already started playing and then stopped/errored mid-stream, do NOT repeat with browser SpeechSynthesis
      if (geminiResult === 'failed_after_play') {
        return { ok: false, errorType: 'network_or_api_error' };
      }

      if (geminiResult === 'autoplay_blocked') {
        this.state = {
          status: 'idle',
          activeEngine: 'gemini-server-tts',
          activeGender: preference.gender,
          lastSpokenText: cleanText,
          currentUtteranceId: null,
          statusMessage: 'Bấm "Nghe Buddy nói" để bật âm thanh trên trình duyệt.',
          autoplayBlocked: true,
          lastErrorType: 'autoplay_blocked',
        };
        this.notify();
        return {
          ok: false,
          autoplayBlocked: true,
          errorType: 'autoplay_blocked',
        };
      }
    }

    // Ensure no newer utterance superseded this one before falling back to browser SpeechSynthesis
    if (token !== this.activeUtteranceToken) {
      return { ok: false, superseded: true };
    }

    // 3. Secondary Fallback Path: Browser SpeechSynthesis with STRICT Vietnamese-Only ('vi' / 'vi-VN') filter
    // Only reached if /api/tts failed with a network/HTTP error BEFORE audio started playing.
    if (this.capabilities.browserSpeechAvailable) {
      const browserResult = await this.tryPlayVietnameseBrowserSpeech(
        normalizedText,
        cleanText,
        preference,
        context,
        token,
        utteranceId
      );

      if (token !== this.activeUtteranceToken || browserResult === 'superseded') {
        return { ok: false, superseded: true };
      }

      if (browserResult === 'played') {
        if (token === this.activeUtteranceToken && onEnded) {
          onEnded();
        }
        return { ok: true };
      }
      if (browserResult === 'autoplay_blocked') {
        this.state = {
          status: 'idle',
          activeEngine: 'browser-speech-synthesis',
          activeGender: preference.gender,
          lastSpokenText: cleanText,
          currentUtteranceId: null,
          statusMessage: 'Bấm "Nghe Buddy nói" để bật âm thanh tiếng Việt.',
          autoplayBlocked: true,
          lastErrorType: 'autoplay_blocked',
        };
        this.notify();
        return {
          ok: false,
          autoplayBlocked: true,
          errorType: 'autoplay_blocked',
        };
      }
    }

    // 4. Final Safe Fallback: Text-only mode (NEVER speak with English/foreign voice, NEVER auto-retry in a loop)
    if (token === this.activeUtteranceToken) {
      this.state = {
        status: 'idle',
        activeEngine: 'text-fallback',
        activeGender: preference.gender,
        lastSpokenText: cleanText,
        currentUtteranceId: null,
        statusMessage: 'Bấm "Nghe Buddy nói" để nghe lại hướng dẫn.',
        autoplayBlocked: false,
        lastErrorType: 'network_or_api_error',
      };
      this.notify();
    }
    return { ok: false, errorType: 'network_or_api_error' };
  }

  private async tryPlayGeminiServerTts(
    normalizedText: string,
    preference: VoicePreference,
    context: VoiceContextType,
    token: number,
    utteranceId: string,
    signal: AbortSignal
  ): Promise<
    'played' | 'autoplay_blocked' | 'failed_before_play' | 'failed_after_play' | 'superseded'
  > {
    try {
      const targetFemaleVoice: FemaleVoiceId = preference.femaleVoiceId || 'Leda';
      const requestedVoiceName =
        preference.gender === 'male' ? 'Puck' : targetFemaleVoice;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: normalizedText,
          gender: preference.gender,
          femaleVoiceId: targetFemaleVoice,
          voiceName: requestedVoiceName,
          context,
        }),
        signal,
      });

      if (token !== this.activeUtteranceToken || signal.aborted) return 'superseded';
      if (!response.ok) return 'failed_before_play';

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Static hosting (e.g., Firebase Hosting without backend Cloud Run rewrite) returned index.html
        return 'failed_before_play';
      }

      const payload = await response.json();
      if (token !== this.activeUtteranceToken || signal.aborted) return 'superseded';
      if (!payload?.audioBase64) return 'failed_before_play';

      const pcmBytes = base64ToUint8Array(payload.audioBase64);
      const mimeType: string = payload.mimeType || 'audio/wav';

      const isAlreadyRiffWav =
        pcmBytes.byteLength >= 12 &&
        pcmBytes[0] === 0x52 && // 'R'
        pcmBytes[1] === 0x49 && // 'I'
        pcmBytes[2] === 0x46 && // 'F'
        pcmBytes[3] === 0x46 && // 'F'
        pcmBytes[8] === 0x57 && // 'W'
        pcmBytes[9] === 0x41 && // 'A'
        pcmBytes[10] === 0x56 && // 'V'
        pcmBytes[11] === 0x45; // 'E'

      let audioBlob: Blob;
      if (isAlreadyRiffWav || mimeType.includes('wav')) {
        audioBlob = new Blob([pcmBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
      } else if (mimeType.includes('pcm') || mimeType.includes('L16')) {
        audioBlob = createWavBlobFromPcm(pcmBytes, payload.sampleRate || 24000, 1, 16);
      } else {
        audioBlob = new Blob([pcmBytes.buffer as ArrayBuffer], { type: mimeType });
      }

      if (token !== this.activeUtteranceToken || signal.aborted) return 'superseded';

      // Never allow Web Speech API and Gemini TTS to play simultaneously
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }

      const audio = this.getOrCreateAudioElement();
      if (!audio) return 'failed_before_play';

      // Cleanly detach any previous listeners on the single shared audio instance
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
      try {
        if (!audio.paused) {
          audio.pause();
        }
      } catch {
        // ignore
      }

      if (this.activeObjectUrl) {
        try {
          URL.revokeObjectURL(this.activeObjectUrl);
        } catch {
          // ignore
        }
        this.activeObjectUrl = null;
      }

      const objectUrl = URL.createObjectURL(audioBlob);
      this.activeObjectUrl = objectUrl;
      audio.src = objectUrl;
      audio.muted = false;
      audio.volume = Math.max(0, Math.min(1, preference.volume));
      const baseRate = preference.speechRate || 1.0;
      const effectiveRate = context === 'help' ? baseRate * 0.96 : baseRate;
      audio.playbackRate = Math.max(0.75, Math.min(1.25, effectiveRate));

      let hasStartedPlaying = false;
      let retriedAbortOnce = false;

      return await new Promise<
        'played' | 'autoplay_blocked' | 'failed_before_play' | 'failed_after_play' | 'superseded'
      >((resolve) => {
        const cleanupUrlIfCurrent = () => {
          if (this.activeObjectUrl === objectUrl) {
            try {
              URL.revokeObjectURL(objectUrl);
            } catch {
              // ignore
            }
            this.activeObjectUrl = null;
          }
        };

        audio.onended = () => {
          cleanupUrlIfCurrent();
          if (token !== this.activeUtteranceToken) {
            resolve('superseded');
            return;
          }
          this.state = {
            ...this.state,
            status: 'idle',
            currentUtteranceId: null,
            statusMessage: 'Buddy đã nói xong.',
            autoplayBlocked: false,
            lastErrorType: null,
          };
          this.notify();
          resolve('played');
        };

        audio.onerror = () => {
          cleanupUrlIfCurrent();
          if (token !== this.activeUtteranceToken) {
            resolve('superseded');
            return;
          }
          this.state = {
            ...this.state,
            status: 'idle',
            currentUtteranceId: null,
            lastErrorType: 'network_or_api_error',
          };
          this.notify();
          resolve(hasStartedPlaying ? 'failed_after_play' : 'failed_before_play');
        };

        const markPlayingSuccess = () => {
          if (token !== this.activeUtteranceToken || signal.aborted) {
            try {
              audio.pause();
            } catch {
              // ignore
            }
            cleanupUrlIfCurrent();
            resolve('superseded');
            return;
          }
          this.isAudioUnlocked = true;
          hasStartedPlaying = true;
          const usedFallback = Boolean(payload?.isFallback);
          const actualVoiceName =
            payload?.requestedVoiceName ||
            (preference.gender === 'male' ? 'Puck' : preference.femaleVoiceId || 'Leda');
          const officialVoiceLabel =
            preference.gender === 'male'
              ? 'Puck · Cậu bạn hoạt bát'
              : actualVoiceName === 'Leda'
              ? 'Leda · Cô bạn dịu dàng, tươi sáng'
              : 'Zephyr · Cô bạn ấm áp, rõ chữ';
          const sourceLabel = usedFallback
            ? `Giọng tiếng Việt dự phòng trên máy chủ (vi-VN · ${
                preference.gender === 'male' ? 'Nam' : 'Nữ'
              })`
            : `Gemini ${officialVoiceLabel}`;

          this.state = {
            status: 'playing',
            activeEngine: usedFallback ? 'browser-speech-synthesis' : 'gemini-server-tts',
            activeGender: preference.gender,
            activeVoiceId: usedFallback ? `vi-VN-${preference.gender}-fallback` : actualVoiceName,
            lastSpokenText: this.state.lastSpokenText,
            currentUtteranceId: utteranceId,
            isUsingFallback: usedFallback,
            activeAudioSourceLabel: sourceLabel,
            statusMessage: usedFallback
              ? `Buddy đang đọc (${sourceLabel})...`
              : `Buddy đang nói (${sourceLabel})...`,
            autoplayBlocked: false,
            lastErrorType: null,
          };
          // Keep geminiTtsAvailable = true so future utterances always try /api/tts first
          this.capabilities.geminiTtsAvailable = true;
          this.updateCapabilityNote();
          this.notify();
        };

        const attemptPlay = () => {
          if (token !== this.activeUtteranceToken || signal.aborted) {
            cleanupUrlIfCurrent();
            resolve('superseded');
            return;
          }

          audio
            .play()
            .then(() => {
              markPlayingSuccess();
            })
            .catch((err: unknown) => {
              if (token !== this.activeUtteranceToken || signal.aborted) {
                cleanupUrlIfCurrent();
                resolve('superseded');
                return;
              }

              const errName =
                err instanceof Error
                  ? err.name
                  : String((err as { name?: string })?.name || '');

              // 1. Browser Autoplay Policy blocked playback
              if (errName === 'NotAllowedError') {
                this.isAudioUnlocked = false;
                cleanupUrlIfCurrent();
                resolve('autoplay_blocked');
                return;
              }

              // 2. AbortError: If interrupted transiently by shared audio element source switch, retry once after 60ms
              if (errName === 'AbortError' && !retriedAbortOnce) {
                retriedAbortOnce = true;
                window.setTimeout(() => {
                  attemptPlay();
                }, 60);
                return;
              }

              cleanupUrlIfCurrent();
              resolve('failed_before_play');
            });
        };

        attemptPlay();
      });
    } catch (err: unknown) {
      if (token !== this.activeUtteranceToken || signal.aborted) {
        return 'superseded';
      }
      const errName =
        err instanceof Error
          ? err.name
          : String((err as { name?: string })?.name || '');
      if (errName === 'AbortError') {
        return 'superseded';
      }
      return 'failed_before_play';
    }
  }

  /**
   * Browser SpeechSynthesis fallback with STRICT Vietnamese-Only voice selection.
   * NEVER falls back to English ('en-US') or non-Vietnamese voices when viVoices is empty (A02).
   */
  private async tryPlayVietnameseBrowserSpeech(
    normalizedText: string,
    displayText: string,
    preference: VoicePreference,
    context: VoiceContextType,
    token: number,
    utteranceId: string
  ): Promise<'played' | 'autoplay_blocked' | 'no_vi_voice' | 'failed' | 'superseded'> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return 'no_vi_voice';
    }

    try {
      const voices = window.speechSynthesis.getVoices() || [];
      // Strictly select voices whose lang starts with 'vi', preferring 'vi-VN'
      const viVoices = voices
        .filter((v) => (v.lang || '').toLowerCase().startsWith('vi'))
        .sort((a, b) => {
          const aExact = (a.lang || '').toLowerCase() === 'vi-vn' ? 0 : 1;
          const bExact = (b.lang || '').toLowerCase() === 'vi-vn' ? 0 : 1;
          return aExact - bExact;
        });

      // CRITICAL RULE: If the browser has NO Vietnamese voice, DO NOT call speechSynthesis.speak with default English voice!
      if (viVoices.length === 0) {
        return 'no_vi_voice';
      }

      this.detachAndCancelBrowserSpeech();

      const utterance = new SpeechSynthesisUtterance(normalizedText);
      this.activeSpeechUtterance = utterance;
      utterance.lang = 'vi-VN';
      utterance.volume = Math.max(0, Math.min(1, preference.volume));

      const baseRate =
        context === 'story'
          ? 0.92
          : context === 'help'
          ? 0.91
          : context === 'guide'
          ? 0.95
          : context === 'celebration'
          ? 0.99
          : context === 'greeting'
          ? 0.96
          : 0.96;
      const userRate = preference.speechRate || 1.0;

      if (preference.gender === 'male') {
        const maleVoice =
          viVoices.find((v) => /nam|male|minh|an|quang|hieu/i.test(v.name)) ||
          (viVoices.length > 1 ? viVoices[1] : viVoices[0]);
        utterance.voice = maleVoice;
        utterance.pitch =
          context === 'celebration'
            ? 0.97
            : context === 'greeting'
            ? 0.95
            : 0.93;
        utterance.rate = Math.max(0.78, Math.min(1.18, baseRate * userRate * 0.97));
      } else {
        const femaleVoice =
          viVoices.find((v) => /nu|nữ|female|linh|mai|lan|hoai|my/i.test(v.name)) ||
          viVoices[0];
        utterance.voice = femaleVoice;
        // Warm, moderate natural pitch for Zephyr fallback
        utterance.pitch =
          context === 'celebration'
            ? 1.06
            : context === 'greeting'
            ? 1.05
            : 1.03;
        utterance.rate = Math.max(0.78, Math.min(1.18, baseRate * userRate));
      }

      return await new Promise<'played' | 'autoplay_blocked' | 'failed' | 'superseded'>(
        (resolve) => {
          utterance.onstart = () => {
            if (token !== this.activeUtteranceToken) {
              this.detachAndCancelBrowserSpeech();
              resolve('superseded');
              return;
            }
            const browserSourceLabel = `Giọng tiếng Việt dự phòng trên trình duyệt (Web Speech API · ${
              preference.gender === 'male' ? 'Nam' : 'Nữ'
            })`;
            this.state = {
              status: 'playing',
              activeEngine: 'browser-speech-synthesis',
              activeGender: preference.gender,
              lastSpokenText: displayText,
              currentUtteranceId: utteranceId,
              isUsingFallback: true,
              activeAudioSourceLabel: browserSourceLabel,
              statusMessage: `Buddy đang đọc (${browserSourceLabel})...`,
              autoplayBlocked: false,
              lastErrorType: null,
            };
            this.updateCapabilityNote();
            this.notify();
          };

          utterance.onend = () => {
            if (this.activeSpeechUtterance === utterance) {
              this.activeSpeechUtterance = null;
            }
            if (token !== this.activeUtteranceToken) {
              resolve('superseded');
              return;
            }
            this.state = {
              ...this.state,
              status: 'idle',
              currentUtteranceId: null,
              statusMessage: 'Buddy đã đọc xong.',
              autoplayBlocked: false,
              lastErrorType: null,
            };
            this.notify();
            resolve('played');
          };

          utterance.onerror = (event) => {
            if (this.activeSpeechUtterance === utterance) {
              this.activeSpeechUtterance = null;
            }
            if (token !== this.activeUtteranceToken) {
              resolve('superseded');
              return;
            }
            const errCode = (event as SpeechSynthesisErrorEvent)?.error || '';
            if (errCode === 'not-allowed') {
              resolve('autoplay_blocked');
            } else {
              this.state = {
                ...this.state,
                status: 'idle',
                currentUtteranceId: null,
                statusMessage: 'Thiết bị chưa có giọng đọc tiếng Việt',
                lastErrorType: 'network_or_api_error',
              };
              this.notify();
              resolve('failed');
            }
          };

          window.speechSynthesis.speak(utterance);
        }
      );
    } catch {
      this.activeSpeechUtterance = null;
      return 'failed';
    }
  }

  public getState(): VoicePlaybackState {
    return { ...this.state };
  }

  public getCapabilities(): VoiceRuntimeCapabilities {
    this.inspectBrowserVoices();
    return { ...this.capabilities };
  }
}

export const voiceService = new UnifiedVoiceService();
