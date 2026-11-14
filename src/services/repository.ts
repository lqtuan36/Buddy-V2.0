import {
  BuddyAppData,
  ParentApproval,
  SchoolScheduleConfig,
  Story,
  Task,
  TaskStep,
} from '../types/domain';
import { createInitialSeedData, SEED_CONTENT_VERSION } from '../data/seedData';
import { getCurrentMonthKey } from './pointsPolicy';

export type StorageMode = 'local-demo' | 'firebase-cloud';

export interface IDataRepository {
  getStorageMode(): StorageMode;
  loadAppData(): Promise<BuddyAppData>;
  saveAppData(data: BuddyAppData): Promise<void>;
  resetToSeedData(): Promise<BuddyAppData>;
}

/**
 * Dedicated StoryRepository interface ready for Firebase Storage / Firestore migration.
 * In Local Storage Demo mode, enforces safe document size limits and clear privacy labeling.
 */
export interface IStoryRepository {
  getStorageMode(): StorageMode;
  getMaxUploadBytes(): number;
  validateStoryPayload(story: Story): { valid: boolean; reason?: string };
}

const STORAGE_KEY = 'buddy_ai_personal_buddy_state_v1';
const MAX_DEMO_STORY_CHARS = 35000; // Safe limit for localStorage demo mode

export class LocalDemoStoryRepository implements IStoryRepository {
  getStorageMode(): StorageMode {
    return 'local-demo';
  }

  getMaxUploadBytes(): number {
    return 1536 * 1024; // 1.5 MB max upload file size in Demo Mode
  }

  validateStoryPayload(story: Story): { valid: boolean; reason?: string } {
    const joined = story.paragraphs.join('\n');
    if (!story.title.trim()) {
      return { valid: false, reason: 'Vui lòng nhập tiêu đề câu chuyện.' };
    }
    if (story.paragraphs.length === 0 || joined.trim().length < 20) {
      return {
        valid: false,
        reason: 'Nội dung truyện quá ngắn. Ba mẹ vui lòng nhập ít nhất 1 đoạn truyện.',
      };
    }
    if (joined.length > MAX_DEMO_STORY_CHARS) {
      return {
        valid: false,
        reason: `Trong chế độ Local Storage Demo, nội dung mỗi truyện tối đa ${MAX_DEMO_STORY_CHARS.toLocaleString()} ký tự để đảm bảo bộ nhớ trình duyệt hoạt động mượt mà.`,
      };
    }
    return { valid: true };
  }
}

export const storyRepository: IStoryRepository = new LocalDemoStoryRepository();

/**
 * Normalizes a task or step title for safe legacy seed comparison so known historical
 * system seed variations (e.g., leading "Bước X:", leading "Bé ", or "balo" vs "cặp")
 * are recognized as unmodified system seed content rather than custom parent edits.
 */
function normalizeForLegacySeedMatch(rawText: string): string {
  return (rawText || '')
    .replace(/^(?:Bước\s*\d+\s*[:.\-–—]\s*)+/i, '')
    .replace(/^Bé\s+/i, '')
    .replace(/\bbalo\b/gi, 'cặp')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Safely merges stored tasks with the latest system seed tasks:
 * - Preserves 100% of parent-created custom tasks (`sourceType: 'custom'` or ID not in `seed.tasks`).
 * - For built-in system tasks (`id` in `seed.tasks`):
 *   - If the task (or an individual step) has NOT been customized by a parent, updates only
 *     system-managed content fields (`actionTitle`, `instruction`, `buddySpeech`, `simpleExplanation`,
 *     `buddyPraise`, `illustrationKey`, `title`, `subtitle`, `contentVersion`) from `seedTask`.
 *   - Preserves parent-controlled administrative fields (`approvalStatus`, `lastApprovedAt`, `starReward`)
 *     and any step/task explicitly customized by a parent (`customizedByParent: true`).
 */
export function syncBuiltinAndCustomTasks(
  parsedTasks: Task[] | undefined,
  seedTasks: Task[],
  parentApprovals: ParentApproval[] | undefined,
  deletedBuiltinTaskIds: string[] = []
): Task[] {
  if (!Array.isArray(parsedTasks) || parsedTasks.length === 0) {
    return seedTasks;
  }

  const syncedTasks: Task[] = parsedTasks.map((t) => {
    const seedTask = seedTasks.find((st) => st.id === t.id);

    // 1. Custom task created by parent or AI draft -> never overwrite content
    if (!seedTask || t.sourceType === 'custom') {
      return {
        ...t,
        sourceType: 'custom',
        customizedByParent: true,
        contentVersion: t.contentVersion ?? SEED_CONTENT_VERSION,
      };
    }

    // 2. Ensure legacy task-backpack (< 5 steps) is upgraded to the 5 Warm Storybook steps
    if (t.id === 'task-backpack' && (!Array.isArray(t.steps) || t.steps.length < 5)) {
      return {
        ...seedTask,
        approvalStatus: t.approvalStatus ?? seedTask.approvalStatus,
        starReward: t.starReward ?? seedTask.starReward,
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
      };
    }

    // Check if parent ever recorded a task save in parentApprovals (for legacy data without customizedByParent)
    const hasParentTaskSaveLog =
      Array.isArray(parentApprovals) &&
      parentApprovals.some(
        (a) =>
          a.targetType === 'task' &&
          a.targetId === t.id &&
          a.id !== 'approval-init-1' &&
          a.reviewedBy === 'Phụ huynh'
      );

    // If neither customizedByParent nor a parent save log exists, this built-in task was never edited by a parent
    if (!t.customizedByParent && !hasParentTaskSaveLog) {
      return {
        ...seedTask,
        approvalStatus: t.approvalStatus ?? seedTask.approvalStatus,
        lastApprovedAt: t.lastApprovedAt || seedTask.lastApprovedAt,
        starReward: t.starReward ?? seedTask.starReward,
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: seedTask.steps.map((seedStep) => ({
          ...seedStep,
          contentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
        })),
      };
    }

    // Otherwise, inspect task header and each step individually so only genuine parent edits are kept
    const isTaskHeaderCustomized =
      Boolean(t.customizedByParent) &&
      (normalizeForLegacySeedMatch(t.title) !== normalizeForLegacySeedMatch(seedTask.title) ||
        (t.subtitle || '').trim().toLowerCase() !== (seedTask.subtitle || '').trim().toLowerCase() ||
        (Array.isArray(t.steps) && t.steps.length !== seedTask.steps.length));

    let anyStepCustomized = false;
    const mergedSteps: TaskStep[] = Array.isArray(t.steps)
      ? t.steps.map((s, sIdx) => {
          const seedStep =
            seedTask.steps.find((ss) => ss.id === s.id) || seedTask.steps[sIdx];
          if (!seedStep) {
            anyStepCustomized = true;
            return {
              ...s,
              customizedByParent: true,
              contentVersion: SEED_CONTENT_VERSION,
            };
          }

          const matchesLegacyOrCurrentSeedStep =
            normalizeForLegacySeedMatch(s.actionTitle) ===
              normalizeForLegacySeedMatch(seedStep.actionTitle) &&
            (s.instruction || '').trim().toLowerCase() ===
              (seedStep.instruction || '').trim().toLowerCase();

          const isStepCustomized =
            s.customizedByParent === true
              ? !matchesLegacyOrCurrentSeedStep
              : s.customizedByParent === false
              ? false
              : !matchesLegacyOrCurrentSeedStep;

          if (!isStepCustomized) {
            return {
              ...s,
              stepNumber: seedStep.stepNumber,
              actionTitle: seedStep.actionTitle,
              instruction: seedStep.instruction,
              buddySpeech: seedStep.buddySpeech,
              simpleExplanation: seedStep.simpleExplanation,
              buddyPraise: seedStep.buddyPraise,
              illustrationKey: seedStep.illustrationKey,
              contentVersion: SEED_CONTENT_VERSION,
              customizedByParent: false,
            };
          }

          anyStepCustomized = true;
          const stripped = (s.actionTitle || '').replace(/^Bé\s+/i, '');
          const cleanTitle = stripped
            ? stripped.charAt(0).toUpperCase() + stripped.slice(1)
            : s.actionTitle;
          return {
            ...seedStep,
            ...s,
            actionTitle: cleanTitle,
            buddySpeech: s.buddySpeech || seedStep.buddySpeech,
            contentVersion: SEED_CONTENT_VERSION,
            customizedByParent: true,
          };
        })
      : seedTask.steps;

    const finalCustomized = isTaskHeaderCustomized || anyStepCustomized;

    return {
      ...seedTask,
      ...t,
      slug: isTaskHeaderCustomized ? t.slug : seedTask.slug,
      title: isTaskHeaderCustomized ? t.title : seedTask.title,
      subtitle: isTaskHeaderCustomized ? t.subtitle : seedTask.subtitle,
      category: isTaskHeaderCustomized ? t.category : seedTask.category,
      iconName: isTaskHeaderCustomized ? t.iconName : seedTask.iconName,
      themeColor: isTaskHeaderCustomized ? t.themeColor : seedTask.themeColor,
      coverIllustration: isTaskHeaderCustomized
        ? t.coverIllustration
        : seedTask.coverIllustration,
      estimatedMinutes: isTaskHeaderCustomized
        ? t.estimatedMinutes
        : seedTask.estimatedMinutes,
      sourceType: 'builtin',
      contentVersion: SEED_CONTENT_VERSION,
      customizedByParent: finalCustomized,
      steps: mergedSteps,
    };
  });

  // Append any newly introduced built-in tasks that were not explicitly deleted by parent
  const existingIds = new Set(syncedTasks.map((t) => t.id));
  const deletedSet = new Set(deletedBuiltinTaskIds || []);
  for (const seedTask of seedTasks) {
    if (!existingIds.has(seedTask.id) && !deletedSet.has(seedTask.id)) {
      syncedTasks.push({
        ...seedTask,
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
      });
    }
  }

  return syncedTasks;
}

/**
 * Safely merges stored schoolSchedule with the latest seed schoolSchedule:
 * - If the parent has not customized the weekly schedule, updates `weeklyDays` to the latest
 *   system seed while preserving `prepReminderTime`, `reminderEnabled`, and `dateOverrides`.
 * - If the parent has customized the schedule, preserves parent changes while normalizing
 *   known legacy default strings (e.g., "CLB Vẽ sáng tạo" -> "Câu Lạc Bộ Vẽ sáng tạo").
 */
export function syncSchoolSchedule(
  parsedSchedule: Partial<SchoolScheduleConfig> | undefined,
  seedSchedule: SchoolScheduleConfig,
  parentApprovals: ParentApproval[] | undefined
): SchoolScheduleConfig {
  if (!parsedSchedule) {
    return seedSchedule;
  }

  const hasParentScheduleEdit =
    Boolean(parsedSchedule.customizedByParent) ||
    (Array.isArray(parentApprovals) &&
      parentApprovals.some(
        (a) => a.targetType === 'schedule' && a.reviewedBy === 'Phụ huynh'
      ));

  const dateOverrides = Array.isArray(parsedSchedule.dateOverrides)
    ? parsedSchedule.dateOverrides
    : seedSchedule.dateOverrides;

  if (
    !hasParentScheduleEdit ||
    !Array.isArray(parsedSchedule.weeklyDays) ||
    parsedSchedule.weeklyDays.length === 0
  ) {
    return {
      ...seedSchedule,
      ...parsedSchedule,
      weeklyDays: seedSchedule.weeklyDays,
      dateOverrides,
      contentVersion: SEED_CONTENT_VERSION,
      customizedByParent: false,
    };
  }

  return {
    ...seedSchedule,
    ...parsedSchedule,
    weeklyDays: parsedSchedule.weeklyDays.map((day) => {
      const seedDay = seedSchedule.weeklyDays.find(
        (sd) => sd.dayOfWeek === day.dayOfWeek
      );
      const cleanSubjects = Array.isArray(day.subjects)
        ? day.subjects.map((subj) =>
            subj === 'CLB Vẽ sáng tạo' ? 'Câu Lạc Bộ Vẽ sáng tạo' : subj
          )
        : seedDay?.subjects || [];
      const cleanNote =
        day.note === 'Đầu tuần mặc đồng phục chỉnh tề nhé con!' ||
        day.note === 'Thứ Năm có tiết Thể dục, con nhớ chuẩn bị giày thể thao nhé!'
          ? seedDay?.note || day.note
          : day.note;
      return {
        ...day,
        subjects: cleanSubjects,
        note: cleanNote,
      };
    }),
    dateOverrides,
    contentVersion: SEED_CONTENT_VERSION,
    customizedByParent: true,
  };
}

/**
 * LocalDemoRepository
 * Persists state in localStorage (`buddy_ai_personal_buddy_state_v1`) with versioned
 * seed synchronization so new system content (`buddySpeech`, `instruction`, `actionTitle`,
 * `buddyPraise`, `schoolSchedule`, etc.) updates automatically without wiping user progress
 * or overwriting parent-customized tasks.
 */
export class LocalDemoRepository implements IDataRepository {
  getStorageMode(): StorageMode {
    return 'local-demo';
  }

  async loadAppData(): Promise<BuddyAppData> {
    const seed = createInitialSeedData();
    if (typeof window === 'undefined') {
      return seed;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw) as Partial<BuddyAppData>;
      const deletedBuiltinTaskIds = Array.isArray(parsed.deletedBuiltinTaskIds)
        ? parsed.deletedBuiltinTaskIds
        : [];

      const merged: BuddyAppData = {
        ...seed,
        ...parsed,
        seedContentVersion: SEED_CONTENT_VERSION,
        deletedBuiltinTaskIds,
        profile: {
          ...seed.profile,
          ...(parsed.profile || {}),
          nickname: (parsed.profile?.nickname || seed.profile.nickname || 'Minh Anh').replace(
            /^Bé\s+/i,
            ''
          ),
          characterVariant:
            parsed.profile?.characterVariant === 'boy' ||
            parsed.profile?.characterVariant === 'girl'
              ? parsed.profile.characterVariant
              : seed.profile.characterVariant || 'girl',
          currentCycleMonth: getCurrentMonthKey(),
        },
        voicePreference: {
          ...seed.voicePreference,
          ...(parsed.voicePreference || {}),
        },
        pointsPolicy: {
          ...seed.pointsPolicy,
          ...(parsed.pointsPolicy || {}),
          monthlyWheelThresholdStars:
            parsed.pointsPolicy?.monthlyWheelThresholdStars &&
            parsed.pointsPolicy.monthlyWheelThresholdStars !== 15 &&
            parsed.pointsPolicy.monthlyWheelThresholdStars !== 20
              ? parsed.pointsPolicy.monthlyWheelThresholdStars
              : 50,
        },
        parentSettings: {
          ...seed.parentSettings,
          ...(parsed.parentSettings || {}),
        },
        schoolSchedule: syncSchoolSchedule(
          parsed.schoolSchedule,
          seed.schoolSchedule,
          parsed.parentApprovals
        ),
        bedtimeStoryConfig: {
          ...seed.bedtimeStoryConfig,
          ...(parsed.bedtimeStoryConfig || {}),
          scheduledByDate: {
            ...seed.bedtimeStoryConfig.scheduledByDate,
            ...(parsed.bedtimeStoryConfig?.scheduledByDate || {}),
          },
        },
        tasks: syncBuiltinAndCustomTasks(
          parsed.tasks,
          seed.tasks,
          parsed.parentApprovals,
          deletedBuiltinTaskIds
        ),
        routines:
          Array.isArray(parsed.routines) && parsed.routines.length > 0
            ? parsed.routines
            : seed.routines,
        stories:
          Array.isArray(parsed.stories) && parsed.stories.length > 0
            ? parsed.stories.map((st, idx) => {
                const seedStory = seed.stories.find((ss) => ss.id === st.id);
                const hasParentStoryEdit =
                  Boolean(st.customizedByParent) ||
                  (Array.isArray(parsed.parentApprovals) &&
                    parsed.parentApprovals.some(
                      (a) =>
                        a.targetType === 'story' &&
                        a.targetId === st.id &&
                        a.reviewedBy === 'Phụ huynh'
                    ));
                const isUnmodifiedBuiltin =
                  st.sourceType === 'builtin' &&
                  Boolean(seedStory) &&
                  !hasParentStoryEdit;
                const hasOfficialV21VoiceAsset =
                  typeof st.audioAssetId === 'string' &&
                  (st.audioAssetId.includes('_Puck_') ||
                    st.audioAssetId.includes('_Zephyr_') ||
                    st.audioAssetId.includes('_Leda_v23f_'));
                return {
                  ...st,
                  title: isUnmodifiedBuiltin && seedStory ? seedStory.title : st.title,
                  summary: isUnmodifiedBuiltin && seedStory ? seedStory.summary : st.summary,
                  paragraphs:
                    isUnmodifiedBuiltin && seedStory ? seedStory.paragraphs : st.paragraphs,
                  moralLesson:
                    isUnmodifiedBuiltin && seedStory ? seedStory.moralLesson : st.moralLesson,
                  reflectionQuestion:
                    isUnmodifiedBuiltin && seedStory
                      ? seedStory.reflectionQuestion
                      : st.reflectionQuestion,
                  reflectionSuggestions:
                    isUnmodifiedBuiltin && seedStory
                      ? seedStory.reflectionSuggestions
                      : st.reflectionSuggestions,
                  contentVersion: isUnmodifiedBuiltin
                    ? SEED_CONTENT_VERSION
                    : st.contentVersion ?? 1,
                  customizedByParent: hasParentStoryEdit,
                  orderIndex: st.orderIndex ?? idx,
                  approvalStatus:
                    st.approvalStatus ?? (st.approvedByParent ? 'approved' : 'draft'),
                  audioAssetId: hasOfficialV21VoiceAsset ? st.audioAssetId : undefined,
                  audioUrl: hasOfficialV21VoiceAsset ? st.audioUrl : undefined,
                  audioStatus: !hasOfficialV21VoiceAsset
                    ? 'none'
                    : st.audioStatus === 'generating' || st.audioStatus === 'failed'
                    ? st.audioUrl
                      ? 'ready'
                      : 'none'
                    : st.audioStatus ?? (st.audioUrl ? 'ready' : 'none'),
                };
              })
            : seed.stories.map((st, idx) => ({
                ...st,
                contentVersion: SEED_CONTENT_VERSION,
                customizedByParent: false,
                orderIndex: st.orderIndex ?? idx,
                approvalStatus:
                  st.approvalStatus ?? (st.approvedByParent ? 'approved' : 'draft'),
                audioStatus: st.audioStatus ?? 'none',
              })),
        rewards:
          Array.isArray(parsed.rewards) && parsed.rewards.length > 0
            ? parsed.rewards.map((rw) => {
                const seedRw = seed.rewards.find((sr) => sr.id === rw.id);
                return seedRw ? { ...rw, description: seedRw.description } : rw;
              })
            : seed.rewards,
        growthTopics:
          Array.isArray(parsed.growthTopics) && parsed.growthTopics.length > 0
            ? parsed.growthTopics.map((savedTopic, idx) => {
                const seedMatch = seed.growthTopics.find(
                  (st) => st.id === savedTopic.id || st.slug === savedTopic.slug
                );
                // Default winding trail coordinates from bottom (88%) to top (18%)
                const defaultCoords = [
                  { x: 48, y: 88 },
                  { x: 34, y: 76 },
                  { x: 48, y: 65 },
                  { x: 58, y: 55 },
                  { x: 45, y: 46 },
                  { x: 36, y: 37 },
                  { x: 44, y: 28 },
                  { x: 48, y: 19 },
                ];
                const fallbackCoord = defaultCoords[idx % defaultCoords.length];
                const hasParentTopicEdit =
                  Boolean(savedTopic.customizedByParent) ||
                  Boolean(savedTopic.isParentUploaded) ||
                  (Array.isArray(parsed.parentApprovals) &&
                    parsed.parentApprovals.some(
                      (a) =>
                        a.targetType === 'journey' &&
                        (a.targetId === savedTopic.id || a.targetId === 'curriculum-batch') &&
                        a.id !== 'approval-init-2' &&
                        a.reviewedBy === 'Phụ huynh'
                    ));
                const isUnmodifiedSeedTopic =
                  Boolean(seedMatch) && !hasParentTopicEdit;
                return {
                  ...(seedMatch || {}),
                  ...savedTopic,
                  title: isUnmodifiedSeedTopic && seedMatch ? seedMatch.title : savedTopic.title,
                  subtitle:
                    isUnmodifiedSeedTopic && seedMatch ? seedMatch.subtitle : savedTopic.subtitle,
                  landmarkName:
                    isUnmodifiedSeedTopic && seedMatch
                      ? seedMatch.landmarkName
                      : savedTopic.landmarkName,
                  xPercent:
                    savedTopic.xPercent ??
                    seedMatch?.xPercent ??
                    fallbackCoord.x,
                  yPercent:
                    savedTopic.yPercent ??
                    seedMatch?.yPercent ??
                    fallbackCoord.y,
                  version: savedTopic.version ?? 1,
                  contentVersion: isUnmodifiedSeedTopic
                    ? SEED_CONTENT_VERSION
                    : savedTopic.contentVersion ?? 1,
                  customizedByParent: hasParentTopicEdit,
                  experiences: Array.isArray(savedTopic.experiences)
                    ? savedTopic.experiences.map((savedExp, eIdx) => {
                        const seedExp = seedMatch?.experiences?.[eIdx];
                        if (isUnmodifiedSeedTopic && seedExp) {
                          return {
                            ...savedExp,
                            title: seedExp.title,
                            promptOrStory: seedExp.promptOrStory,
                            buddySpeech: seedExp.buddySpeech,
                            choices: seedExp.choices,
                            choiceFeedbacks: seedExp.choiceFeedbacks,
                            recommendedChoiceIndices: seedExp.recommendedChoiceIndices,
                            actionSuggestion:
                              seedExp.actionSuggestion ?? savedExp.actionSuggestion,
                            buddyWarmFeedback: seedExp.buddyWarmFeedback,
                          };
                        }
                        return {
                          ...(seedExp || {}),
                          ...savedExp,
                        };
                      })
                    : seedMatch?.experiences || [],
                };
              })
            : seed.growthTopics,
        growthLogs: Array.isArray(parsed.growthLogs) ? parsed.growthLogs : seed.growthLogs,
        starLedger: Array.isArray(parsed.starLedger) ? parsed.starLedger : seed.starLedger,
        rewardSpins: Array.isArray(parsed.rewardSpins) ? parsed.rewardSpins : seed.rewardSpins,
        taskRuns:
          Array.isArray(parsed.taskRuns) && parsed.taskRuns.length > 0
            ? parsed.taskRuns
            : seed.taskRuns,
        parentApprovals: Array.isArray(parsed.parentApprovals)
          ? parsed.parentApprovals
          : seed.parentApprovals,
        chatHistory:
          Array.isArray(parsed.chatHistory) && parsed.chatHistory.length > 0
            ? parsed.chatHistory
            : seed.chatHistory,
      };

      // Immediately write the synchronized & migrated state back to localStorage
      // so `buddy_ai_personal_buddy_state_v1` reflects the latest content version right away.
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore storage quota errors during automatic migration write
      }

      return merged;
    } catch {
      return seed;
    }
  }

  async saveAppData(data: BuddyAppData): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Không thể lưu dữ liệu vào bộ nhớ trình duyệt:', err);
    }
  }

  async resetToSeedData(): Promise<BuddyAppData> {
    const seed = createInitialSeedData();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
    return seed;
  }
}

export const appRepository: IDataRepository = new LocalDemoRepository();
