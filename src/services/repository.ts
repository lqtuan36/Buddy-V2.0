import {
  BuddyAppData,
  ContentOriginStatus,
  GrowthExperienceItem,
  GrowthQualityTopic,
  MigrationConflictItem,
  MigrationMetadata,
  ParentApproval,
  SchoolScheduleConfig,
  Story,
  Task,
  TaskStep,
} from '../types/domain';
import {
  BUDDY_APP_VERSION,
  BUDDY_BUILD_TIME,
  BUDDY_DATA_SCHEMA_VERSION,
  BUDDY_GIT_COMMIT_SHORT,
  createInitialSeedData,
  SEED_CONTENT_VERSION,
} from '../data/seedData';
import { getCurrentMonthKey } from './pointsPolicy';

export type StorageMode = 'local-demo' | 'firebase-cloud';

export interface VersionDiagnostics {
  appVersion: string;
  bundledContentVersion: number;
  bundledSchemaVersion: number;
  storedAppVersion?: string;
  storedContentVersion?: number;
  storedSchemaVersion?: number;
  buildTime: string;
  gitCommit: string;
  storageMode: StorageMode;
  storageKey: string;
  backupAvailable: boolean;
  backupCreatedAt?: string;
  isContentUpToDate: boolean;
  isSchemaUpToDate: boolean;
}

export interface IDataRepository {
  getStorageMode(): StorageMode;
  loadAppData(): Promise<BuddyAppData>;
  saveAppData(data: BuddyAppData): Promise<void>;
  resetToSeedData(): Promise<BuddyAppData>;
  checkAndSyncContentUpdates(currentData?: BuddyAppData): Promise<{
    data: BuddyAppData;
    updatedCount: number;
    preservedCustomCount: number;
    conflictsCount: number;
    status: MigrationMetadata['lastMigrationStatus'];
  }>;
  resolveConflict(
    currentData: BuddyAppData,
    conflictId: string,
    resolution: 'preserved_stored' | 'applied_seed'
  ): Promise<BuddyAppData>;
  restoreFromBackup(): Promise<BuddyAppData | null>;
  getVersionDiagnostics(currentData?: BuddyAppData): VersionDiagnostics;
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

export const STORAGE_KEY = 'buddy_ai_personal_buddy_state_v1';
export const BACKUP_STORAGE_KEY = 'buddy_ai_personal_buddy_backup_v1';
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
 * Normalizes a text string for legacy seed comparison so known historical
 * system variations (e.g., leading "Bước X:", leading "Bé ", "con" vs "bạn",
 * "Buddy" vs "mình", "balo" vs "cặp") are recognized as unmodified system seed content
 * rather than custom parent edits.
 */
export function normalizeForLegacySeedMatch(rawText: string): string {
  return (rawText || '')
    .replace(/^(?:Bước\s*\d+\s*[:.\-–—]\s*)+/i, '')
    .replace(/^Bé\s+/i, '')
    .replace(/\bbalo\b/gi, 'cặp')
    .replace(/\bcon\b/gi, 'bạn')
    .replace(/\bbé\b/gi, 'bạn')
    .replace(/\bBuddy\b/gi, 'mình')
    .replace(/\bCLB\b/gi, 'Câu Lạc Bộ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Known historical system phrases & baseline fragments across Buddy v1.0 - v2.1.
 * Used ONLY when legacy data lacks explicit `customizedFields` or `contentVersion`
 * so we never mistake an older system seed string for a parent customization.
 */
const HISTORICAL_SYSTEM_SIGNATURES: Record<string, string[]> = {
  'task-backpack': [
    'chuẩn bị cặp sách',
    'soạn cặp sách',
    'sắp xếp sách vở và hộp bút gọn gàng',
    'xem thời khóa biểu',
    'mở thời khóa biểu',
    'lấy sách và vở theo môn học',
    'soạn sách vở theo thời khóa biểu',
    'tìm sách giáo khoa và vở bài tập',
    'xếp sách vào cặp ngay ngắn',
    'cho sách vở và hộp bút vào cặp',
    'đặt sách to ở phía sau sát lưng cặp',
    'kiểm tra hộp bút đầy đủ',
    'mở hộp bút kiểm tra bút chì',
    'đặt cặp ở vị trí phù hợp',
    'để bình nước vào túi hông',
    'ngày mai chúng mình sẽ học những môn gì nhỉ',
    'ngôi nhà balo',
  ],
  'task-study-desk': [
    'dọn góc học tập',
    'giữ mặt bàn sạch thoáng',
    'gom bút vào ống đựng',
    'nhặt bút chì, bút màu trên mặt bàn',
    'xếp sách truyện lên kệ',
    'gom các quyển sách, truyện đã đọc xong',
    'bỏ giấy vụn và lau mặt bàn',
    'bỏ giấy nháp cũ vào sọt rác',
  ],
  'task-toys': [
    'dọn đồ chơi',
    'đưa các bạn đồ chơi về đúng giỏ',
    'cất các khối xếp hình vào hộp',
    'nhặt những mảnh ghép và khối gỗ',
    'đặt thú bông lên kệ hoặc góc giường',
    'ôm các bạn gấu bông, búp bê',
    'đặt giỏ đồ chơi về góc phòng',
    'đẩy nhẹ giỏ đồ chơi sát vào góc tường',
  ],
  'task-wash-hands': [
    'rửa tay',
    'rửa tay sạch khỏe',
    'rửa tay sạch bọt xà phòng',
    'làm ướt tay và lấy xà phòng',
    'chà kỹ lòng bàn tay và kẽ ngón tay',
    'xả sạch nước và lau khô bằng khăn',
  ],
  'task-tomorrow-prep': [
    'chuẩn bị đồ dùng ngày mai',
    'soạn sẵn quần áo và mũ nón',
    'chọn bộ quần áo đi học ngày mai',
    'chuẩn bị tất, giày và mũ đội đầu',
    'điểm danh đồ dùng lần cuối',
  ],
};

function matchesHistoricalSystemBaseline(
  entityId: string,
  storedVal: unknown,
  seedVal: unknown
): boolean {
  if (typeof storedVal === 'string' && typeof seedVal === 'string') {
    const normStored = normalizeForLegacySeedMatch(storedVal);
    const normSeed = normalizeForLegacySeedMatch(seedVal);
    if (!normStored || normStored === normSeed) {
      return true;
    }
    const signatures = HISTORICAL_SYSTEM_SIGNATURES[entityId] || [];
    if (signatures.some((sig) => normStored.includes(sig))) {
      return true;
    }
    // Check if the only difference is legacy "Bước X:" prefix or companion pronouns
    if (normSeed.includes(normStored) || normStored.includes(normSeed)) {
      return true;
    }
    return false;
  }
  if (Array.isArray(storedVal) && Array.isArray(seedVal)) {
    if (storedVal.length === seedVal.length) {
      return storedVal.every((item, idx) =>
        matchesHistoricalSystemBaseline(entityId, item, seedVal[idx])
      );
    }
  }
  return JSON.stringify(storedVal) === JSON.stringify(seedVal);
}

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim();
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Checks if `parentApprovals` contains an explicit content CUSTOMIZATION record
 * (NOT a pure approval event!).
 * Fixes Bug 2.2: Pure approval events (`status: 'approved'` / `actionType: 'approval'`)
 * are NEVER treated as proof that a parent edited content.
 */
export function hasExplicitCustomizationLog(
  parentApprovals: ParentApproval[] | undefined,
  targetType: ParentApproval['targetType'],
  targetId: string
): boolean {
  if (!Array.isArray(parentApprovals)) return false;
  return parentApprovals.some(
    (a) =>
      a.targetType === targetType &&
      a.targetId === targetId &&
      (a.actionType === 'customization' ||
        (Array.isArray(a.customizedFields) && a.customizedFields.length > 0))
  );
}

export function hasParentApprovalEvent(
  parentApprovals: ParentApproval[] | undefined,
  targetType: ParentApproval['targetType'],
  targetId: string
): boolean {
  if (!Array.isArray(parentApprovals)) return false;
  return parentApprovals.some(
    (a) =>
      a.targetType === targetType &&
      (a.targetId === targetId || (targetType === 'journey' && a.targetId === 'curriculum-batch')) &&
      a.reviewedBy === 'Phụ huynh' &&
      !a.id.startsWith('approval-init-')
  );
}

type FieldDecision = 'use_seed' | 'preserve_custom' | 'preserve_unresolved';

/**
 * Core field-level decision engine (Sections 2.2, 2.3, 4.1-4.3, 6.3):
 * Never uses inequality with the NEWEST seed alone as proof of parent customization.
 */
function resolveFieldSyncDecision(params: {
  entityId: string;
  fieldName: string;
  storedValue: unknown;
  seedValue: unknown;
  customizedByParent?: boolean;
  customizedFields?: string[];
  originStatus?: ContentOriginStatus;
  hasItemVersion: boolean;
  hasKnownRootVersion: boolean;
  hasExplicitCustomLog: boolean;
}): FieldDecision {
  const {
    entityId,
    fieldName,
    storedValue,
    seedValue,
    customizedByParent,
    customizedFields,
    originStatus,
    hasItemVersion,
    hasKnownRootVersion,
    hasExplicitCustomLog,
  } = params;

  if (storedValue === undefined || storedValue === null || storedValue === '') {
    return 'use_seed';
  }

  // 1. If explicit field-level customization list exists (v2.2+), trust it authoritatively:
  // Only fields in `customizedFields` are parent-edited; all other fields receive new seed updates.
  if (Array.isArray(customizedFields)) {
    return customizedFields.includes(fieldName) ? 'preserve_custom' : 'use_seed';
  }

  // 2. If item was previously marked as unresolved legacy origin, keep it unresolved until parent decides
  if (originStatus === 'legacy_unresolved') {
    return areValuesEqual(storedValue, seedValue) ? 'use_seed' : 'preserve_unresolved';
  }

  // 3. If explicitly marked as NOT customized by parent, always upgrade to latest system seed
  if (customizedByParent === false) {
    return 'use_seed';
  }

  // 4. If stored value already equals current seed or matches known historical system baselines,
  // it is unmodified system content -> upgrade to latest seed.
  if (
    areValuesEqual(storedValue, seedValue) ||
    matchesHistoricalSystemBaseline(entityId, storedValue, seedValue)
  ) {
    return 'use_seed';
  }

  // 5. If explicitly marked `customizedByParent === true` (or explicit customization log),
  // and this specific field does NOT match historical system baselines, then the parent edited this field.
  if (customizedByParent === true || hasExplicitCustomLog) {
    return 'preserve_custom';
  }

  // 6. If `customizedByParent` is undefined, check whether the stored payload has known system version metadata:
  // In v1.0-v2.1, parent task edits always stamped `customizedByParent: true`, whereas untouched seed items
  // had `seedContentVersion` / `contentVersion` without `customizedByParent: true`.
  if (hasItemVersion || hasKnownRootVersion) {
    return 'use_seed';
  }

  // 7. Truly ambiguous legacy data (no `customizedByParent`, no `contentVersion`, no `seedContentVersion`,
  // and value does not match any historical system baseline):
  // Do NOT blindly overwrite and do NOT falsely mark as parent-customized (Section 2.3 & 6.3).
  return 'preserve_unresolved';
}

/**
 * Canonical step ID alias resolver for legacy `task-backpack` or older step IDs.
 */
function findMatchingSeedStep(
  storedStep: TaskStep,
  seedTask: Task
): TaskStep | undefined {
  const direct = seedTask.steps.find((ss) => ss.id === storedStep.id);
  if (direct) return direct;

  // Legacy alias mapping (e.g., "bp-1" -> "step-bp-1")
  const normalizedId = (storedStep.id || '').replace(/^bp-/, 'step-bp-');
  const byAlias = seedTask.steps.find((ss) => ss.id === normalizedId);
  if (byAlias) return byAlias;

  // Match by normalized actionTitle against seed steps
  const normStoredTitle = normalizeForLegacySeedMatch(storedStep.actionTitle);
  if (normStoredTitle) {
    const byTitle = seedTask.steps.find(
      (ss) => normalizeForLegacySeedMatch(ss.actionTitle) === normStoredTitle
    );
    if (byTitle) return byTitle;
  }

  // For legacy 3-step backpack or same-length tasks where stepNumber aligns and step ID is generic
  if (
    storedStep.id?.startsWith('step-') &&
    !storedStep.id.startsWith('step-custom-') &&
    !storedStep.id.startsWith('step-new-') &&
    !storedStep.id.startsWith('step-ai-')
  ) {
    const byNumber = seedTask.steps.find((ss) => ss.stepNumber === storedStep.stepNumber);
    if (byNumber) return byNumber;
  }

  return undefined;
}

/**
 * Safely merges stored tasks with the latest system seed tasks (Section 5.1):
 * - Separates Approval (`approvalStatus`) from Customization (`customizedByParent`, `customizedFields`).
 * - Never treats `parentApprovals` approval logs as proof of content customization.
 * - Never uses inequality with the newest seed alone as proof of parent customization.
 * - Merges built-in tasks and steps by stable ID at the field level (`title`, `subtitle`,
 *   `actionTitle`, `instruction`, `buddySpeech`, `simpleExplanation`, `buddyPraise`, `illustrationKey`).
 * - Special handling for `task-backpack` (and any task expanding from 3 to 5 steps):
 *   Never replaces the whole task when `steps.length < 5`; preserves any parent-customized steps/fields
 *   and appends missing built-in steps from `seedTask`.
 */
export function syncBuiltinAndCustomTasks(
  parsedTasks: Task[] | undefined,
  seedTasks: Task[],
  parentApprovals: ParentApproval[] | undefined,
  deletedBuiltinTaskIds: string[] = [],
  options: {
    hasKnownRootVersion?: boolean;
    conflictsOut?: MigrationConflictItem[];
    archivedTasksOut?: Task[];
  } = {}
): Task[] {
  const hasKnownRootVersion = options.hasKnownRootVersion ?? true;
  const conflictsOut = options.conflictsOut ?? [];
  const archivedTasksOut = options.archivedTasksOut ?? [];

  if (!Array.isArray(parsedTasks) || parsedTasks.length === 0) {
    return seedTasks.map((st) => ({
      ...st,
      sourceType: 'builtin',
      contentVersion: SEED_CONTENT_VERSION,
      baseContentVersion: SEED_CONTENT_VERSION,
      customizedByParent: false,
      customizedFields: [],
      originStatus: 'builtin_unmodified',
      steps: st.steps.map((s) => ({
        ...s,
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        customizedFields: [],
        originStatus: 'builtin_unmodified',
      })),
    }));
  }

  const syncedTasks: Task[] = [];

  for (const t of parsedTasks) {
    const seedTask = seedTasks.find((st) => st.id === t.id);

    // 1. If task is not in current seedTasks:
    if (!seedTask) {
      const isExplicitlyBuiltinRetired =
        t.sourceType === 'builtin' &&
        !t.customizedByParent &&
        !t.id.startsWith('task-custom-') &&
        !t.id.startsWith('task-ai-');

      if (isExplicitlyBuiltinRetired) {
        // Section 4.6: Archive retired unmodified built-in task without deleting progress/stars
        archivedTasksOut.push({
          ...t,
          originStatus: 'builtin_unmodified',
        });
        continue;
      }

      // Parent-created custom task -> preserve 100% untouched
      syncedTasks.push({
        ...t,
        sourceType: 'custom',
        customizedByParent: true,
        originStatus: 'parent_created',
        contentVersion: t.contentVersion ?? SEED_CONTENT_VERSION,
        baseContentVersion: t.baseContentVersion ?? t.contentVersion ?? SEED_CONTENT_VERSION,
      });
      continue;
    }

    if (t.sourceType === 'custom') {
      syncedTasks.push({
        ...t,
        sourceType: 'custom',
        customizedByParent: true,
        originStatus: 'parent_created',
        contentVersion: t.contentVersion ?? SEED_CONTENT_VERSION,
        baseContentVersion: t.baseContentVersion ?? t.contentVersion ?? SEED_CONTENT_VERSION,
      });
      continue;
    }

    // 2. Built-in task (`seedTask` exists):
    const hasTaskItemVersion =
      typeof t.contentVersion === 'number' || typeof t.baseContentVersion === 'number';
    const hasTaskExplicitCustomLog = hasExplicitCustomizationLog(
      parentApprovals,
      'task',
      t.id
    );
    const hasTaskApprovalOnly = hasParentApprovalEvent(parentApprovals, 'task', t.id);

    const taskHeaderFields = [
      'title',
      'subtitle',
      'category',
      'iconName',
      'themeColor',
      'coverIllustration',
      'estimatedMinutes',
    ] as const;

    const mergedHeader: Record<string, unknown> = {};
    const taskCustomizedFields: string[] = [];
    let taskHasUnresolved = false;

    for (const field of taskHeaderFields) {
      const decision = resolveFieldSyncDecision({
        entityId: t.id,
        fieldName: field,
        storedValue: t[field],
        seedValue: seedTask[field],
        customizedByParent: t.customizedByParent,
        customizedFields: t.customizedFields,
        originStatus: t.originStatus,
        hasItemVersion: hasTaskItemVersion,
        hasKnownRootVersion,
        hasExplicitCustomLog: hasTaskExplicitCustomLog,
      });

      if (decision === 'preserve_custom') {
        mergedHeader[field] = t[field];
        taskCustomizedFields.push(field);
      } else if (decision === 'preserve_unresolved') {
        mergedHeader[field] = t[field];
        taskHasUnresolved = true;
        conflictsOut.push({
          id: `conflict-task-${t.id}-${field}`,
          entityType: 'task',
          entityId: t.id,
          title: t.title || seedTask.title,
          field,
          storedValuePreview: String(t[field] ?? ''),
          seedValuePreview: String(seedTask[field] ?? ''),
          reason: 'unknown_legacy_origin',
          resolution: 'preserved_stored',
          detectedAt: new Date().toISOString(),
        });
      } else {
        mergedHeader[field] = seedTask[field];
      }
    }

    // 3. Step-by-step merge by stable ID (never wholesale-replacing `task-backpack` when steps.length < 5)
    const storedSteps = Array.isArray(t.steps) ? t.steps : [];
    const deletedStepIds = new Set(t.deletedBuiltinStepIds || []);
    const matchedStoredStepIds = new Set<string>();
    const stepFields = [
      'actionTitle',
      'instruction',
      'buddySpeech',
      'simpleExplanation',
      'buddyPraise',
      'illustrationKey',
    ] as const;

    let anyStepCustomized = false;
    let anyStepUnresolved = false;
    const mergedSteps: TaskStep[] = [];

    for (const seedStep of seedTask.steps) {
      if (deletedStepIds.has(seedStep.id)) {
        continue;
      }

      const storedStep = storedSteps.find(
        (s) =>
          !matchedStoredStepIds.has(s.id) &&
          findMatchingSeedStep(s, seedTask)?.id === seedStep.id
      );

      if (!storedStep) {
        // Missing built-in step (e.g. Steps 4 & 5 when upgrading a 3-step `task-backpack` to 5 steps)
        mergedSteps.push({
          ...seedStep,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
          customizedFields: [],
          originStatus: 'builtin_unmodified',
        });
        continue;
      }

      matchedStoredStepIds.add(storedStep.id);
      const hasStepVersion =
        typeof storedStep.contentVersion === 'number' ||
        typeof storedStep.baseContentVersion === 'number' ||
        hasTaskItemVersion;

      // Determine if storedStep has explicit `customizedByParent: true` ONLY when at least one field
      // genuinely diverges from historical/current system baselines (fixes false positive when parent saved task without editing this step)
      const stepCustomizedFields: string[] = [];
      let stepHasUnresolved = false;
      const mergedStepData: Record<string, unknown> = {};

      for (const sField of stepFields) {
        const decision = resolveFieldSyncDecision({
          entityId: t.id,
          fieldName: sField,
          storedValue: storedStep[sField],
          seedValue: seedStep[sField],
          customizedByParent: storedStep.customizedByParent,
          customizedFields: storedStep.customizedFields,
          originStatus: storedStep.originStatus,
          hasItemVersion: hasStepVersion,
          hasKnownRootVersion,
          hasExplicitCustomLog: false,
        });

        if (decision === 'preserve_custom') {
          if (sField === 'actionTitle' && typeof storedStep.actionTitle === 'string') {
            const stripped = storedStep.actionTitle.replace(/^Bé\s+/i, '');
            mergedStepData[sField] = stripped
              ? stripped.charAt(0).toUpperCase() + stripped.slice(1)
              : storedStep.actionTitle;
          } else {
            mergedStepData[sField] = storedStep[sField];
          }
          stepCustomizedFields.push(sField);
        } else if (decision === 'preserve_unresolved') {
          mergedStepData[sField] = storedStep[sField];
          stepHasUnresolved = true;
          conflictsOut.push({
            id: `conflict-step-${t.id}-${seedStep.id}-${sField}`,
            entityType: 'task_step',
            entityId: seedStep.id,
            parentEntityId: t.id,
            title: `${seedTask.title} · Bước ${seedStep.stepNumber}`,
            field: sField,
            storedValuePreview: String(storedStep[sField] ?? ''),
            seedValuePreview: String(seedStep[sField] ?? ''),
            reason: 'unknown_legacy_origin',
            resolution: 'preserved_stored',
            detectedAt: new Date().toISOString(),
          });
        } else {
          mergedStepData[sField] = seedStep[sField];
        }
      }

      const isStepCustom = stepCustomizedFields.length > 0;
      if (isStepCustom) anyStepCustomized = true;
      if (stepHasUnresolved) anyStepUnresolved = true;

      const stepOrigin: ContentOriginStatus = stepHasUnresolved
        ? 'legacy_unresolved'
        : isStepCustom
        ? 'parent_customized'
        : hasTaskApprovalOnly
        ? 'builtin_approved_only'
        : 'builtin_unmodified';

      mergedSteps.push({
        ...seedStep,
        ...storedStep,
        id: seedStep.id,
        actionTitle: mergedStepData.actionTitle as string,
        instruction: mergedStepData.instruction as string,
        buddySpeech: mergedStepData.buddySpeech as string | undefined,
        simpleExplanation: mergedStepData.simpleExplanation as string,
        buddyPraise: mergedStepData.buddyPraise as string,
        illustrationKey: mergedStepData.illustrationKey as TaskStep['illustrationKey'],
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: isStepCustom,
        customizedFields: stepCustomizedFields,
        originStatus: stepOrigin,
      });
    }

    // 4. Preserve any extra steps added by the parent (or archive retired unmodified steps)
    const archivedSteps: TaskStep[] = [...(t.archivedSteps || [])];
    for (const unmatchedStep of storedSteps) {
      if (matchedStoredStepIds.has(unmatchedStep.id)) continue;

      const isParentAddedStep =
        unmatchedStep.customizedByParent === true ||
        unmatchedStep.id.startsWith('step-custom-') ||
        unmatchedStep.id.startsWith('step-new-') ||
        unmatchedStep.id.startsWith('step-ai-') ||
        !matchesHistoricalSystemBaseline(t.id, unmatchedStep.actionTitle, '');

      if (isParentAddedStep) {
        anyStepCustomized = true;
        mergedSteps.push({
          ...unmatchedStep,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: unmatchedStep.baseContentVersion ?? SEED_CONTENT_VERSION,
          customizedByParent: true,
          customizedFields: unmatchedStep.customizedFields ?? ['actionTitle', 'instruction'],
          originStatus: 'parent_created',
        });
      } else {
        archivedSteps.push(unmatchedStep);
      }
    }

    // Re-number stepNumber sequentially (1..N)
    const renumberedSteps = mergedSteps.map((st, idx) => ({
      ...st,
      stepNumber: idx + 1,
    }));

    const isTaskCustomized = taskCustomizedFields.length > 0 || anyStepCustomized;
    const isTaskUnresolved = taskHasUnresolved || anyStepUnresolved;
    const taskOrigin: ContentOriginStatus = isTaskUnresolved
      ? 'legacy_unresolved'
      : isTaskCustomized
      ? 'parent_customized'
      : hasTaskApprovalOnly
      ? 'builtin_approved_only'
      : 'builtin_unmodified';

    syncedTasks.push({
      ...seedTask,
      ...t,
      slug: seedTask.slug,
      title: mergedHeader.title as string,
      subtitle: mergedHeader.subtitle as string,
      category: mergedHeader.category as Task['category'],
      iconName: mergedHeader.iconName as string,
      themeColor: mergedHeader.themeColor as Task['themeColor'],
      coverIllustration: mergedHeader.coverIllustration as Task['coverIllustration'],
      estimatedMinutes: mergedHeader.estimatedMinutes as number,
      approvalStatus: t.approvalStatus ?? seedTask.approvalStatus,
      lastApprovedAt: t.lastApprovedAt || seedTask.lastApprovedAt,
      starReward: t.starReward ?? seedTask.starReward,
      sourceType: 'builtin',
      contentVersion: SEED_CONTENT_VERSION,
      baseContentVersion: SEED_CONTENT_VERSION,
      customizedByParent: isTaskCustomized,
      customizedFields: taskCustomizedFields,
      originStatus: taskOrigin,
      archivedSteps: archivedSteps.length > 0 ? archivedSteps : undefined,
      steps: renumberedSteps,
    });
  }

  // 5. Append any newly introduced built-in tasks from `seedTasks` not deleted by parent
  const existingIds = new Set(syncedTasks.map((t) => t.id));
  const deletedSet = new Set(deletedBuiltinTaskIds || []);
  for (const seedTask of seedTasks) {
    if (!existingIds.has(seedTask.id) && !deletedSet.has(seedTask.id)) {
      syncedTasks.push({
        ...seedTask,
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        customizedFields: [],
        originStatus: 'builtin_unmodified',
        steps: seedTask.steps.map((s) => ({
          ...s,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
          customizedFields: [],
          originStatus: 'builtin_unmodified',
        })),
      });
    }
  }

  return syncedTasks;
}

/**
 * Safely merges stored stories with the latest system seed stories (Section 5.2):
 * - Separates story approval (`approvedByParent`, `approvalStatus`, `parentApprovals`) from content customization.
 * - Built-in stories that were only approved/scheduled still receive new text/paragraphs/questions from `seedStories`.
 * - Field-level customization support for built-in stories edited by parents.
 * - Preserves 100% of parent-uploaded/manual stories.
 * - Appends newly added seed stories so old `stories` arrays never block new sample stories.
 * - Never restores stale audio URLs/assets from localStorage.
 */
export function syncStories(
  parsedStories: Story[] | undefined,
  seedStories: Story[],
  parentApprovals: ParentApproval[] | undefined,
  deletedBuiltinStoryIds: string[] = [],
  options: {
    hasKnownRootVersion?: boolean;
    conflictsOut?: MigrationConflictItem[];
  } = {}
): Story[] {
  const hasKnownRootVersion = options.hasKnownRootVersion ?? true;
  const conflictsOut = options.conflictsOut ?? [];

  if (!Array.isArray(parsedStories) || parsedStories.length === 0) {
    return seedStories.map((st, idx) => ({
      ...st,
      sourceType: 'builtin',
      contentVersion: SEED_CONTENT_VERSION,
      baseContentVersion: SEED_CONTENT_VERSION,
      customizedByParent: false,
      customizedFields: [],
      originStatus: 'builtin_unmodified',
      orderIndex: st.orderIndex ?? idx,
      approvalStatus: st.approvalStatus ?? (st.approvedByParent ? 'approved' : 'draft'),
      audioAssetId: undefined,
      audioUrl: undefined,
      audioStatus: 'none',
    }));
  }

  const storyContentFields = [
    'title',
    'category',
    'summary',
    'durationMinutes',
    'ageRecommendation',
    'coverTheme',
    'illustrationType',
    'paragraphs',
    'moralLesson',
    'reflectionQuestion',
    'reflectionSuggestions',
  ] as const;

  const syncedStories: Story[] = parsedStories.map((st, idx) => {
    const seedStory = seedStories.find((ss) => ss.id === st.id);

    // 1. Parent-uploaded or custom story -> preserve 100%
    if (
      !seedStory ||
      st.isParentUploaded === true ||
      (st.sourceType && st.sourceType !== 'builtin')
    ) {
      return {
        ...st,
        customizedByParent: true,
        originStatus: 'parent_created',
        contentVersion: st.contentVersion ?? 1,
        baseContentVersion: st.baseContentVersion ?? st.contentVersion ?? 1,
        orderIndex: st.orderIndex ?? idx,
        approvalStatus: st.approvalStatus ?? (st.approvedByParent ? 'approved' : 'draft'),
        audioAssetId: undefined,
        audioUrl: undefined,
        audioStatus: 'none',
      };
    }

    // 2. Built-in story: resolve each content field independently
    const hasStoryItemVersion =
      typeof st.contentVersion === 'number' || typeof st.baseContentVersion === 'number';
    const hasStoryExplicitCustomLog = hasExplicitCustomizationLog(
      parentApprovals,
      'story',
      st.id
    );
    const hasStoryApprovalOnly = hasParentApprovalEvent(parentApprovals, 'story', st.id);

    const mergedStoryFields: Record<string, unknown> = {};
    const customizedFields: string[] = [];
    let hasUnresolved = false;

    for (const field of storyContentFields) {
      const decision = resolveFieldSyncDecision({
        entityId: st.id,
        fieldName: field,
        storedValue: st[field],
        seedValue: seedStory[field],
        customizedByParent: st.customizedByParent,
        customizedFields: st.customizedFields,
        originStatus: st.originStatus,
        hasItemVersion: hasStoryItemVersion,
        hasKnownRootVersion,
        hasExplicitCustomLog: hasStoryExplicitCustomLog,
      });

      if (decision === 'preserve_custom') {
        mergedStoryFields[field] = st[field];
        customizedFields.push(field);
      } else if (decision === 'preserve_unresolved') {
        mergedStoryFields[field] = st[field];
        hasUnresolved = true;
        conflictsOut.push({
          id: `conflict-story-${st.id}-${field}`,
          entityType: 'story',
          entityId: st.id,
          title: st.title || seedStory.title,
          field,
          storedValuePreview: Array.isArray(st[field])
            ? (st[field] as string[]).join(' | ').slice(0, 120)
            : String(st[field] ?? ''),
          seedValuePreview: Array.isArray(seedStory[field])
            ? (seedStory[field] as string[]).join(' | ').slice(0, 120)
            : String(seedStory[field] ?? ''),
          reason: 'unknown_legacy_origin',
          resolution: 'preserved_stored',
          detectedAt: new Date().toISOString(),
        });
      } else {
        mergedStoryFields[field] = seedStory[field];
      }
    }

    const isCustom = customizedFields.length > 0;
    const originStatus: ContentOriginStatus = hasUnresolved
      ? 'legacy_unresolved'
      : isCustom
      ? 'parent_customized'
      : hasStoryApprovalOnly
      ? 'builtin_approved_only'
      : 'builtin_unmodified';

    return {
      ...seedStory,
      ...st,
      title: mergedStoryFields.title as string,
      category: mergedStoryFields.category as Story['category'],
      summary: mergedStoryFields.summary as string,
      durationMinutes: mergedStoryFields.durationMinutes as number,
      ageRecommendation: mergedStoryFields.ageRecommendation as string,
      coverTheme: mergedStoryFields.coverTheme as Story['coverTheme'],
      illustrationType: mergedStoryFields.illustrationType as Story['illustrationType'],
      paragraphs: mergedStoryFields.paragraphs as string[],
      moralLesson: mergedStoryFields.moralLesson as string,
      reflectionQuestion: mergedStoryFields.reflectionQuestion as string,
      reflectionSuggestions: mergedStoryFields.reflectionSuggestions as string[],
      sourceType: 'builtin',
      contentVersion: SEED_CONTENT_VERSION,
      baseContentVersion: SEED_CONTENT_VERSION,
      customizedByParent: isCustom,
      customizedFields,
      originStatus,
      orderIndex: st.orderIndex ?? idx,
      approvedByParent: st.approvedByParent ?? seedStory.approvedByParent,
      approvalStatus: st.approvalStatus ?? (st.approvedByParent ? 'approved' : 'draft'),
      // Never persist session audio URLs or stale cache in localStorage
      audioAssetId: undefined,
      audioUrl: undefined,
      audioStatus: 'none',
    };
  });

  // 3. Append any newly added built-in stories from `seedStories`
  const existingIds = new Set(syncedStories.map((s) => s.id));
  const deletedSet = new Set(deletedBuiltinStoryIds || []);
  for (const seedStory of seedStories) {
    if (!existingIds.has(seedStory.id) && !deletedSet.has(seedStory.id)) {
      syncedStories.push({
        ...seedStory,
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        customizedFields: [],
        originStatus: 'builtin_unmodified',
        orderIndex: syncedStories.length,
        approvalStatus:
          seedStory.approvalStatus ?? (seedStory.approvedByParent ? 'approved' : 'draft'),
        audioAssetId: undefined,
        audioUrl: undefined,
        audioStatus: 'none',
      });
    }
  }

  return syncedStories;
}

/**
 * Safely merges stored GrowthQualityTopics and their Experiences with the latest seed (Section 5.3):
 * - Never treats topic approval or batch curriculum approval (`curriculum-batch`) as content customization.
 * - Matches experiences by stable `id` (fallback `type`), never solely by array index.
 * - Preserves 100% of child progress (`status`, `childResponse`, `selectedChoices`, `emotionTag`, `realLifeConfirmed`, `lastUpdatedAt`).
 * - Supports field-level customization on both topic headers and individual experiences.
 * - Appends any newly added built-in growth topics from `seedTopics`.
 */
export function syncGrowthTopics(
  parsedTopics: GrowthQualityTopic[] | undefined,
  seedTopics: GrowthQualityTopic[],
  parentApprovals: ParentApproval[] | undefined,
  deletedBuiltinTopicIds: string[] = [],
  options: {
    hasKnownRootVersion?: boolean;
    conflictsOut?: MigrationConflictItem[];
  } = {}
): GrowthQualityTopic[] {
  const hasKnownRootVersion = options.hasKnownRootVersion ?? true;
  const conflictsOut = options.conflictsOut ?? [];

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

  if (!Array.isArray(parsedTopics) || parsedTopics.length === 0) {
    return seedTopics.map((st, idx) => {
      const fallbackCoord = defaultCoords[idx % defaultCoords.length];
      return {
        ...st,
        xPercent: st.xPercent ?? fallbackCoord.x,
        yPercent: st.yPercent ?? fallbackCoord.y,
        version: st.version ?? 1,
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        customizedFields: [],
        originStatus: 'builtin_unmodified',
        experiences: st.experiences.map((exp) => ({
          ...exp,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
          customizedFields: [],
          originStatus: 'builtin_unmodified',
        })),
      };
    });
  }

  const topicHeaderFields = [
    'title',
    'subtitle',
    'landmarkName',
    'themeColor',
    'illustrationKey',
  ] as const;

  const expContentFields = [
    'title',
    'promptOrStory',
    'buddySpeech',
    'choices',
    'choiceFeedbacks',
    'recommendedChoiceIndices',
    'actionSuggestion',
    'buddyWarmFeedback',
  ] as const;

  const syncedTopics: GrowthQualityTopic[] = parsedTopics.map((savedTopic, idx) => {
    const fallbackCoord = defaultCoords[idx % defaultCoords.length];
    const seedMatch = seedTopics.find(
      (st) => st.id === savedTopic.id || st.slug === savedTopic.slug
    );

    // 1. Parent-uploaded or custom topic not in seed -> preserve 100%
    if (!seedMatch || savedTopic.isParentUploaded === true) {
      return {
        ...savedTopic,
        xPercent: savedTopic.xPercent ?? fallbackCoord.x,
        yPercent: savedTopic.yPercent ?? fallbackCoord.y,
        version: savedTopic.version ?? 1,
        contentVersion: savedTopic.contentVersion ?? 1,
        baseContentVersion: savedTopic.baseContentVersion ?? savedTopic.contentVersion ?? 1,
        customizedByParent: true,
        originStatus: 'parent_created',
      };
    }

    // 2. Built-in topic: check header fields and experiences by stable ID
    const hasTopicItemVersion =
      typeof savedTopic.contentVersion === 'number' ||
      typeof savedTopic.baseContentVersion === 'number';
    const hasTopicExplicitCustomLog = hasExplicitCustomizationLog(
      parentApprovals,
      'journey',
      savedTopic.id
    );
    const hasTopicApprovalOnly = hasParentApprovalEvent(
      parentApprovals,
      'journey',
      savedTopic.id
    );

    const mergedTopicHeader: Record<string, unknown> = {};
    const topicCustomizedFields: string[] = [];
    let topicHasUnresolved = false;

    for (const field of topicHeaderFields) {
      const decision = resolveFieldSyncDecision({
        entityId: savedTopic.id,
        fieldName: field,
        storedValue: savedTopic[field],
        seedValue: seedMatch[field],
        customizedByParent: savedTopic.customizedByParent,
        customizedFields: savedTopic.customizedFields,
        originStatus: savedTopic.originStatus,
        hasItemVersion: hasTopicItemVersion,
        hasKnownRootVersion,
        hasExplicitCustomLog: hasTopicExplicitCustomLog,
      });

      if (decision === 'preserve_custom') {
        mergedTopicHeader[field] = savedTopic[field];
        topicCustomizedFields.push(field);
      } else if (decision === 'preserve_unresolved') {
        mergedTopicHeader[field] = savedTopic[field];
        topicHasUnresolved = true;
        conflictsOut.push({
          id: `conflict-topic-${savedTopic.id}-${field}`,
          entityType: 'growth_topic',
          entityId: savedTopic.id,
          title: savedTopic.title || seedMatch.title,
          field,
          storedValuePreview: String(savedTopic[field] ?? ''),
          seedValuePreview: String(seedMatch[field] ?? ''),
          reason: 'unknown_legacy_origin',
          resolution: 'preserved_stored',
          detectedAt: new Date().toISOString(),
        });
      } else {
        mergedTopicHeader[field] = seedMatch[field];
      }
    }

    const savedExps = Array.isArray(savedTopic.experiences) ? savedTopic.experiences : [];
    const matchedSavedExpIds = new Set<string>();
    let anyExpCustomized = false;
    let anyExpUnresolved = false;

    const mergedExperiences: GrowthExperienceItem[] = seedMatch.experiences.map((seedExp) => {
      // Match by stable ID first, then by experience type ('explore' | 'understand' | 'practice' | 'share')
      const savedExp =
        savedExps.find((e) => !matchedSavedExpIds.has(e.id) && e.id === seedExp.id) ||
        savedExps.find((e) => !matchedSavedExpIds.has(e.id) && e.type === seedExp.type);

      if (!savedExp) {
        return {
          ...seedExp,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
          customizedFields: [],
          originStatus: 'builtin_unmodified',
        };
      }

      matchedSavedExpIds.add(savedExp.id);
      const hasExpVersion =
        typeof savedExp.contentVersion === 'number' ||
        typeof savedExp.baseContentVersion === 'number' ||
        hasTopicItemVersion;

      const mergedExpFields: Record<string, unknown> = {};
      const expCustomizedFields: string[] = [];
      let expHasUnresolved = false;

      for (const eField of expContentFields) {
        const decision = resolveFieldSyncDecision({
          entityId: `${savedTopic.id}:${seedExp.id}`,
          fieldName: eField,
          storedValue: savedExp[eField],
          seedValue: seedExp[eField],
          customizedByParent: savedExp.customizedByParent ?? savedTopic.customizedByParent,
          customizedFields: savedExp.customizedFields,
          originStatus: savedExp.originStatus ?? savedTopic.originStatus,
          hasItemVersion: hasExpVersion,
          hasKnownRootVersion,
          hasExplicitCustomLog: false,
        });

        if (decision === 'preserve_custom') {
          mergedExpFields[eField] = savedExp[eField];
          expCustomizedFields.push(eField);
        } else if (decision === 'preserve_unresolved') {
          mergedExpFields[eField] = savedExp[eField];
          expHasUnresolved = true;
          conflictsOut.push({
            id: `conflict-exp-${savedTopic.id}-${seedExp.id}-${eField}`,
            entityType: 'growth_experience',
            entityId: seedExp.id,
            parentEntityId: savedTopic.id,
            title: `${seedMatch.title} · ${seedExp.typeLabel}`,
            field: eField,
            storedValuePreview: Array.isArray(savedExp[eField])
              ? (savedExp[eField] as string[]).join(' | ').slice(0, 120)
              : String(savedExp[eField] ?? ''),
            seedValuePreview: Array.isArray(seedExp[eField])
              ? (seedExp[eField] as string[]).join(' | ').slice(0, 120)
              : String(seedExp[eField] ?? ''),
            reason: 'unknown_legacy_origin',
            resolution: 'preserved_stored',
            detectedAt: new Date().toISOString(),
          });
        } else {
          mergedExpFields[eField] = seedExp[eField];
        }
      }

      const isExpCustom = expCustomizedFields.length > 0;
      if (isExpCustom) anyExpCustomized = true;
      if (expHasUnresolved) anyExpUnresolved = true;

      return {
        ...seedExp,
        ...savedExp,
        id: seedExp.id,
        type: seedExp.type,
        typeLabel: seedExp.typeLabel,
        title: mergedExpFields.title as string,
        promptOrStory: mergedExpFields.promptOrStory as string,
        buddySpeech: mergedExpFields.buddySpeech as string | undefined,
        choices: mergedExpFields.choices as string[] | undefined,
        choiceFeedbacks: mergedExpFields.choiceFeedbacks as string[] | undefined,
        recommendedChoiceIndices: mergedExpFields.recommendedChoiceIndices as number[] | undefined,
        actionSuggestion: mergedExpFields.actionSuggestion as string | undefined,
        buddyWarmFeedback: mergedExpFields.buddyWarmFeedback as string,
        // Layer 4: Always preserve child's experiential progress & responses
        status: savedExp.status ?? seedExp.status,
        childResponse: savedExp.childResponse ?? seedExp.childResponse,
        selectedChoices: savedExp.selectedChoices ?? seedExp.selectedChoices,
        emotionTag: savedExp.emotionTag ?? seedExp.emotionTag,
        realLifeConfirmed: savedExp.realLifeConfirmed ?? seedExp.realLifeConfirmed,
        lastUpdatedAt: savedExp.lastUpdatedAt ?? seedExp.lastUpdatedAt,
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: isExpCustom,
        customizedFields: expCustomizedFields,
        originStatus: expHasUnresolved
          ? 'legacy_unresolved'
          : isExpCustom
          ? 'parent_customized'
          : hasTopicApprovalOnly
          ? 'builtin_approved_only'
          : 'builtin_unmodified',
      };
    });

    // Preserve any extra custom experiences added by parent
    for (const extraExp of savedExps) {
      if (!matchedSavedExpIds.has(extraExp.id)) {
        anyExpCustomized = true;
        mergedExperiences.push({
          ...extraExp,
          customizedByParent: true,
          originStatus: 'parent_created',
        });
      }
    }

    const isTopicCustomized = topicCustomizedFields.length > 0 || anyExpCustomized;
    const isTopicUnresolved = topicHasUnresolved || anyExpUnresolved;
    const topicOrigin: ContentOriginStatus = isTopicUnresolved
      ? 'legacy_unresolved'
      : isTopicCustomized
      ? 'parent_customized'
      : hasTopicApprovalOnly
      ? 'builtin_approved_only'
      : 'builtin_unmodified';

    return {
      ...seedMatch,
      ...savedTopic,
      title: mergedTopicHeader.title as string,
      subtitle: mergedTopicHeader.subtitle as string,
      landmarkName: mergedTopicHeader.landmarkName as string,
      themeColor: mergedTopicHeader.themeColor as GrowthQualityTopic['themeColor'],
      illustrationKey: mergedTopicHeader.illustrationKey as GrowthQualityTopic['illustrationKey'],
      xPercent: savedTopic.xPercent ?? seedMatch.xPercent ?? fallbackCoord.x,
      yPercent: savedTopic.yPercent ?? seedMatch.yPercent ?? fallbackCoord.y,
      version: savedTopic.version ?? 1,
      contentVersion: SEED_CONTENT_VERSION,
      baseContentVersion: SEED_CONTENT_VERSION,
      customizedByParent: isTopicCustomized,
      customizedFields: topicCustomizedFields,
      originStatus: topicOrigin,
      experiences: mergedExperiences,
    };
  });

  // 3. Append any newly added built-in growth topics from `seedTopics`
  const existingIds = new Set(syncedTopics.map((t) => t.id));
  const existingSlugs = new Set(syncedTopics.map((t) => t.slug));
  const deletedSet = new Set(deletedBuiltinTopicIds || []);

  for (const seedTopic of seedTopics) {
    if (
      !existingIds.has(seedTopic.id) &&
      !existingSlugs.has(seedTopic.slug) &&
      !deletedSet.has(seedTopic.id)
    ) {
      const coord = defaultCoords[syncedTopics.length % defaultCoords.length];
      syncedTopics.push({
        ...seedTopic,
        stageOrder: syncedTopics.length + 1,
        xPercent: seedTopic.xPercent ?? coord.x,
        yPercent: seedTopic.yPercent ?? coord.y,
        version: 1,
        contentVersion: SEED_CONTENT_VERSION,
        baseContentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        customizedFields: [],
        originStatus: 'builtin_unmodified',
        experiences: seedTopic.experiences.map((exp) => ({
          ...exp,
          contentVersion: SEED_CONTENT_VERSION,
          baseContentVersion: SEED_CONTENT_VERSION,
          customizedByParent: false,
          customizedFields: [],
          originStatus: 'builtin_unmodified',
        })),
      });
    }
  }

  return syncedTopics;
}

/**
 * Safely merges stored schoolSchedule with the latest seed schoolSchedule.
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
        (a) =>
          a.targetType === 'schedule' &&
          (a.actionType === 'schedule_update' ||
            a.actionType === 'customization' ||
            a.reviewedBy === 'Phụ huynh')
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
 * Validates structural and relational integrity of a migrated `BuddyAppData` object
 * before committing it to Local Storage (Section 6.2 Step 5).
 */
export function validateMigratedAppData(
  candidate: BuddyAppData,
  previous?: Partial<BuddyAppData>
): { valid: boolean; error?: string } {
  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, error: 'Dữ liệu sau migration không phải là object hợp lệ.' };
  }
  if (!candidate.profile || typeof candidate.profile.displayName !== 'string' || !candidate.profile.displayName.trim()) {
    return { valid: false, error: 'Thiếu thông tin hồ sơ trẻ (profile.displayName).' };
  }
  if (!Array.isArray(candidate.tasks) || candidate.tasks.length === 0) {
    return { valid: false, error: 'Danh sách nhiệm vụ (tasks) bị rỗng sau migration.' };
  }
  for (const t of candidate.tasks) {
    if (!t.id || !Array.isArray(t.steps) || t.steps.length === 0) {
      return { valid: false, error: `Nhiệm vụ "${t.id || 'unknown'}" thiếu danh sách các bước.` };
    }
  }
  if (!Array.isArray(candidate.stories) || candidate.stories.length === 0) {
    return { valid: false, error: 'Danh sách truyện (stories) bị rỗng sau migration.' };
  }
  if (!Array.isArray(candidate.growthTopics) || candidate.growthTopics.length === 0) {
    return { valid: false, error: 'Danh sách chủ đề phẩm chất (growthTopics) bị rỗng sau migration.' };
  }
  if (!Array.isArray(candidate.starLedger)) {
    return { valid: false, error: 'Sổ sao (starLedger) không hợp lệ.' };
  }

  // Ensure no stars or taskRuns were lost compared to `previous`
  if (previous && Array.isArray(previous.starLedger) && previous.starLedger.length > 0) {
    if (candidate.starLedger.length < previous.starLedger.length) {
      return {
        valid: false,
        error: 'Số lượng giao dịch sao sau migration ít hơn dữ liệu gốc (vi phạm bảo toàn sao).',
      };
    }
  }
  if (previous && Array.isArray(previous.taskRuns) && previous.taskRuns.length > 0) {
    if (!Array.isArray(candidate.taskRuns) || candidate.taskRuns.length < previous.taskRuns.length) {
      return {
        valid: false,
        error: 'Lịch sử hoàn thành nhiệm vụ (taskRuns) bị thiếu sau migration.',
      };
    }
  }

  return { valid: true };
}

/**
 * Pure, deterministic, idempotent migration pipeline (Section VI):
 * Takes a raw/parsed stored `Partial<BuddyAppData>` and the canonical `seed: BuddyAppData`,
 * performs 4-layer synchronization, validates relational invariants, and returns the migrated state.
 */
export function runControlledDataMigration(
  parsed: Partial<BuddyAppData>,
  seed: BuddyAppData = createInitialSeedData(),
  options: { backupAvailable?: boolean; backupCreatedAt?: string } = {}
): {
  migrated: BuddyAppData;
  updatedBuiltinTasksCount: number;
  updatedBuiltinStoriesCount: number;
  updatedBuiltinTopicsCount: number;
  preservedCustomizationsCount: number;
  conflicts: MigrationConflictItem[];
} {
  // Check if input is malformed / corrupted (e.g. non-object or explicitly broken tasks array type)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('INVALID_STORED_STATE_OBJECT');
  }
  if (parsed.tasks !== undefined && !Array.isArray(parsed.tasks)) {
    throw new Error('CORRUPTED_TASKS_ARRAY');
  }
  if (parsed.starLedger !== undefined && !Array.isArray(parsed.starLedger)) {
    throw new Error('CORRUPTED_STAR_LEDGER');
  }

  const prevContentVersion = parsed.contentVersion ?? parsed.seedContentVersion;
  const prevSchemaVersion = parsed.schemaVersion;
  const prevAppVersion = parsed.appVersion;
  const hasKnownRootVersion = typeof prevContentVersion === 'number' && prevContentVersion > 0;

  const deletedBuiltinTaskIds = Array.isArray(parsed.deletedBuiltinTaskIds)
    ? Array.from(new Set(parsed.deletedBuiltinTaskIds))
    : [];
  const deletedBuiltinStoryIds = Array.isArray(parsed.deletedBuiltinStoryIds)
    ? Array.from(new Set(parsed.deletedBuiltinStoryIds))
    : [];
  const deletedBuiltinTopicIds = Array.isArray(parsed.deletedBuiltinTopicIds)
    ? Array.from(new Set(parsed.deletedBuiltinTopicIds))
    : [];

  const conflicts: MigrationConflictItem[] = [];
  const archivedBuiltinTasks: Task[] = Array.isArray(parsed.archivedBuiltinTasks)
    ? [...parsed.archivedBuiltinTasks]
    : [];

  const syncedTasks = syncBuiltinAndCustomTasks(
    parsed.tasks,
    seed.tasks,
    parsed.parentApprovals,
    deletedBuiltinTaskIds,
    {
      hasKnownRootVersion,
      conflictsOut: conflicts,
      archivedTasksOut: archivedBuiltinTasks,
    }
  );

  const syncedStories = syncStories(
    parsed.stories,
    seed.stories,
    parsed.parentApprovals,
    deletedBuiltinStoryIds,
    {
      hasKnownRootVersion,
      conflictsOut: conflicts,
    }
  );

  const syncedTopics = syncGrowthTopics(
    parsed.growthTopics,
    seed.growthTopics,
    parsed.parentApprovals,
    deletedBuiltinTopicIds,
    {
      hasKnownRootVersion,
      conflictsOut: conflicts,
    }
  );

  const syncedSchedule = syncSchoolSchedule(
    parsed.schoolSchedule,
    seed.schoolSchedule,
    parsed.parentApprovals
  );

  // Deduplicate starLedger and taskRuns by ID to guarantee strict idempotency
  const dedupById = <T extends { id: string }>(items: T[] | undefined, fallback: T[]): T[] => {
    if (!Array.isArray(items)) return fallback;
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  const starLedger = dedupById(parsed.starLedger, seed.starLedger);
  const taskRuns =
    Array.isArray(parsed.taskRuns) && parsed.taskRuns.length > 0
      ? dedupById(parsed.taskRuns, seed.taskRuns)
      : seed.taskRuns;
  const growthLogs = Array.isArray(parsed.growthLogs)
    ? dedupById(parsed.growthLogs, seed.growthLogs)
    : seed.growthLogs;
  const rewardSpins = Array.isArray(parsed.rewardSpins)
    ? dedupById(parsed.rewardSpins, seed.rewardSpins)
    : seed.rewardSpins;
  const parentApprovals = Array.isArray(parsed.parentApprovals)
    ? dedupById(parsed.parentApprovals, seed.parentApprovals)
    : seed.parentApprovals;

  // Count statistics for migration report
  const updatedBuiltinTasksCount = syncedTasks.filter(
    (t) => t.sourceType === 'builtin'
  ).length;
  const updatedBuiltinStoriesCount = syncedStories.filter(
    (s) => s.sourceType === 'builtin' && !s.isParentUploaded
  ).length;
  const updatedBuiltinTopicsCount = syncedTopics.filter(
    (t) => !t.isParentUploaded
  ).length;
  const preservedCustomizationsCount =
    syncedTasks.filter((t) => t.customizedByParent || t.sourceType === 'custom').length +
    syncedStories.filter((s) => s.customizedByParent || s.isParentUploaded).length +
    syncedTopics.filter((t) => t.customizedByParent || t.isParentUploaded).length +
    (syncedSchedule.customizedByParent ? 1 : 0);

  const isAlreadyCurrent =
    prevContentVersion === SEED_CONTENT_VERSION &&
    prevSchemaVersion === BUDDY_DATA_SCHEMA_VERSION &&
    prevAppVersion === BUDDY_APP_VERSION;

  const migrationMetadata: MigrationMetadata = {
    appVersion: BUDDY_APP_VERSION,
    contentVersion: SEED_CONTENT_VERSION,
    schemaVersion: BUDDY_DATA_SCHEMA_VERSION,
    previousAppVersion: prevAppVersion,
    previousContentVersion: prevContentVersion,
    previousSchemaVersion: prevSchemaVersion,
    lastMigratedAt: new Date().toISOString(),
    lastMigrationStatus: isAlreadyCurrent ? 'no_op_up_to_date' : 'success',
    backupAvailable: Boolean(options.backupAvailable),
    backupCreatedAt: options.backupCreatedAt,
    updatedBuiltinTasksCount,
    updatedBuiltinStoriesCount,
    updatedBuiltinTopicsCount,
    preservedCustomizationsCount,
    conflicts,
  };

  const rawDisplayName = (
    parsed.profile?.displayName ||
    parsed.profile?.nickname ||
    seed.profile.displayName ||
    'Minh Anh'
  ).replace(/^Bé\s+/i, '');

  const migrated: BuddyAppData = {
    ...seed,
    ...parsed,
    appVersion: BUDDY_APP_VERSION,
    contentVersion: SEED_CONTENT_VERSION,
    schemaVersion: BUDDY_DATA_SCHEMA_VERSION,
    seedContentVersion: SEED_CONTENT_VERSION,
    deletedBuiltinTaskIds,
    deletedBuiltinStoryIds,
    deletedBuiltinTopicIds,
    archivedBuiltinTasks: archivedBuiltinTasks.length > 0 ? archivedBuiltinTasks : undefined,
    migrationMetadata,
    profile: {
      ...seed.profile,
      ...(parsed.profile || {}),
      displayName: rawDisplayName,
      nickname: (parsed.profile?.nickname || rawDisplayName).replace(/^Bé\s+/i, ''),
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
      femaleVoiceId:
        parsed.voicePreference?.femaleVoiceId === 'Zephyr' ? 'Zephyr' : 'Leda',
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
    schoolSchedule: syncedSchedule,
    bedtimeStoryConfig: {
      ...seed.bedtimeStoryConfig,
      ...(parsed.bedtimeStoryConfig || {}),
      scheduledByDate: {
        ...seed.bedtimeStoryConfig.scheduledByDate,
        ...(parsed.bedtimeStoryConfig?.scheduledByDate || {}),
      },
    },
    tasks: syncedTasks,
    routines:
      Array.isArray(parsed.routines) && parsed.routines.length > 0
        ? parsed.routines.map((r) => ({
            ...r,
            completedDates: Array.isArray(r.completedDates)
              ? Array.from(new Set(r.completedDates))
              : [],
          }))
        : seed.routines,
    stories: syncedStories,
    rewards:
      Array.isArray(parsed.rewards) && parsed.rewards.length > 0
        ? parsed.rewards.map((rw) => {
            const seedRw = seed.rewards.find((sr) => sr.id === rw.id);
            return seedRw ? { ...rw, description: rw.description || seedRw.description } : rw;
          })
        : seed.rewards,
    growthTopics: syncedTopics,
    growthLogs,
    starLedger,
    rewardSpins,
    taskRuns,
    parentApprovals,
    chatHistory:
      Array.isArray(parsed.chatHistory) && parsed.chatHistory.length > 0
        ? parsed.chatHistory
        : seed.chatHistory,
  };

  const validation = validateMigratedAppData(migrated, parsed);
  if (!validation.valid) {
    throw new Error(validation.error || 'MIGRATION_VALIDATION_FAILED');
  }

  return {
    migrated,
    updatedBuiltinTasksCount,
    updatedBuiltinStoriesCount,
    updatedBuiltinTopicsCount,
    preservedCustomizationsCount,
    conflicts,
  };
}

/**
 * Resolves a specific `MigrationConflictItem` according to parent choice:
 * - `'applied_seed'`: Updates the ambiguous field to the canonical seed value and clears the conflict.
 * - `'preserved_stored'`: Marks the field as an explicit parent customization (`customizedFields`) and clears the conflict.
 */
export function resolveMigrationConflictInMemory(
  currentData: BuddyAppData,
  conflictId: string,
  resolution: 'preserved_stored' | 'applied_seed',
  seed: BuddyAppData = createInitialSeedData()
): BuddyAppData {
  const conflicts = currentData.migrationMetadata?.conflicts || [];
  const target = conflicts.find((c) => c.id === conflictId);
  if (!target) return currentData;

  let nextTasks = [...currentData.tasks];
  let nextStories = [...currentData.stories];
  let nextTopics = [...currentData.growthTopics];

  if (target.entityType === 'task') {
    const seedTask = seed.tasks.find((st) => st.id === target.entityId);
    nextTasks = nextTasks.map((t) => {
      if (t.id !== target.entityId || !seedTask) return t;
      if (resolution === 'applied_seed') {
        const nextFields = (t.customizedFields || []).filter((f) => f !== target.field);
        return {
          ...t,
          [target.field]: seedTask[target.field as keyof Task],
          customizedFields: nextFields,
          customizedByParent: nextFields.length > 0 || t.steps.some((s) => s.customizedByParent),
          originStatus: nextFields.length > 0 ? 'parent_customized' : 'builtin_unmodified',
        };
      } else {
        const nextFields = Array.from(new Set([...(t.customizedFields || []), target.field]));
        return {
          ...t,
          customizedFields: nextFields,
          customizedByParent: true,
          originStatus: 'parent_customized',
        };
      }
    });
  } else if (target.entityType === 'task_step') {
    const seedTask = seed.tasks.find((st) => st.id === target.parentEntityId);
    const seedStep = seedTask?.steps.find((ss) => ss.id === target.entityId);
    nextTasks = nextTasks.map((t) => {
      if (t.id !== target.parentEntityId || !seedStep) return t;
      const updatedSteps = t.steps.map((s) => {
        if (s.id !== target.entityId) return s;
        if (resolution === 'applied_seed') {
          const nextFields = (s.customizedFields || []).filter((f) => f !== target.field);
          return {
            ...s,
            [target.field]: seedStep[target.field as keyof TaskStep],
            customizedFields: nextFields,
            customizedByParent: nextFields.length > 0,
            originStatus: nextFields.length > 0 ? ('parent_customized' as const) : ('builtin_unmodified' as const),
          };
        } else {
          const nextFields = Array.from(new Set([...(s.customizedFields || []), target.field]));
          return {
            ...s,
            customizedFields: nextFields,
            customizedByParent: true,
            originStatus: 'parent_customized' as const,
          };
        }
      });
      const anyCustom =
        (t.customizedFields && t.customizedFields.length > 0) ||
        updatedSteps.some((s) => s.customizedByParent);
      return {
        ...t,
        steps: updatedSteps,
        customizedByParent: anyCustom,
        originStatus: anyCustom ? 'parent_customized' : 'builtin_unmodified',
      };
    });
  } else if (target.entityType === 'story') {
    const seedStory = seed.stories.find((ss) => ss.id === target.entityId);
    nextStories = nextStories.map((st) => {
      if (st.id !== target.entityId || !seedStory) return st;
      if (resolution === 'applied_seed') {
        const nextFields = (st.customizedFields || []).filter((f) => f !== target.field);
        return {
          ...st,
          [target.field]: seedStory[target.field as keyof Story],
          customizedFields: nextFields,
          customizedByParent: nextFields.length > 0,
          originStatus: nextFields.length > 0 ? 'parent_customized' : 'builtin_unmodified',
        };
      } else {
        const nextFields = Array.from(new Set([...(st.customizedFields || []), target.field]));
        return {
          ...st,
          customizedFields: nextFields,
          customizedByParent: true,
          originStatus: 'parent_customized',
        };
      }
    });
  } else if (target.entityType === 'growth_topic' || target.entityType === 'growth_experience') {
    const topicId = target.entityType === 'growth_topic' ? target.entityId : target.parentEntityId;
    const seedTopic = seed.growthTopics.find((st) => st.id === topicId);
    nextTopics = nextTopics.map((tp) => {
      if (tp.id !== topicId || !seedTopic) return tp;
      if (target.entityType === 'growth_topic') {
        if (resolution === 'applied_seed') {
          const nextFields = (tp.customizedFields || []).filter((f) => f !== target.field);
          return {
            ...tp,
            [target.field]: seedTopic[target.field as keyof GrowthQualityTopic],
            customizedFields: nextFields,
            customizedByParent: nextFields.length > 0,
            originStatus: nextFields.length > 0 ? 'parent_customized' : 'builtin_unmodified',
          };
        } else {
          const nextFields = Array.from(new Set([...(tp.customizedFields || []), target.field]));
          return {
            ...tp,
            customizedFields: nextFields,
            customizedByParent: true,
            originStatus: 'parent_customized',
          };
        }
      } else {
        const seedExp = seedTopic.experiences.find((se) => se.id === target.entityId);
        if (!seedExp) return tp;
        const nextExps = tp.experiences.map((exp) => {
          if (exp.id !== target.entityId) return exp;
          if (resolution === 'applied_seed') {
            const nextFields = (exp.customizedFields || []).filter((f) => f !== target.field);
            return {
              ...exp,
              [target.field]: seedExp[target.field as keyof GrowthExperienceItem],
              customizedFields: nextFields,
              customizedByParent: nextFields.length > 0,
              originStatus: nextFields.length > 0 ? ('parent_customized' as const) : ('builtin_unmodified' as const),
            };
          } else {
            const nextFields = Array.from(new Set([...(exp.customizedFields || []), target.field]));
            return {
              ...exp,
              customizedFields: nextFields,
              customizedByParent: true,
              originStatus: 'parent_customized' as const,
            };
          }
        });
        return {
          ...tp,
          experiences: nextExps,
        };
      }
    });
  }

  const remainingConflicts = conflicts.filter((c) => c.id !== conflictId);

  return {
    ...currentData,
    tasks: nextTasks,
    stories: nextStories,
    growthTopics: nextTopics,
    migrationMetadata: currentData.migrationMetadata
      ? {
          ...currentData.migrationMetadata,
          conflicts: remainingConflicts,
        }
      : undefined,
  };
}

interface StoredBackupEnvelope {
  savedAt: string;
  schemaVersion?: number;
  contentVersion?: number;
  appVersion?: string;
  rawState: string;
}

/**
 * LocalDemoRepository
 * Persists state in localStorage (`buddy_ai_personal_buddy_state_v1`) with controlled
 * v2.2 migration, bounded pre-migration backup (`buddy_ai_personal_buddy_backup_v1`),
 * and 4-layer separation (System Content Library, Family/Child Profile, Approvals & Customizations, Progress & Rewards).
 */
export class LocalDemoRepository implements IDataRepository {
  getStorageMode(): StorageMode {
    return 'local-demo';
  }

  private readBackupEnvelope(): StoredBackupEnvelope | null {
    if (typeof window === 'undefined') return null;
    try {
      const rawBackup = window.localStorage.getItem(BACKUP_STORAGE_KEY);
      if (!rawBackup) return null;
      const parsed = JSON.parse(rawBackup) as StoredBackupEnvelope;
      if (parsed && typeof parsed.rawState === 'string') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private writeBoundedBackup(rawCurrentState: string, parsedCurrent: Partial<BuddyAppData>): {
    ok: boolean;
    savedAt?: string;
  } {
    if (typeof window === 'undefined') return { ok: false };
    try {
      const savedAt = new Date().toISOString();
      const envelope: StoredBackupEnvelope = {
        savedAt,
        schemaVersion: parsedCurrent.schemaVersion ?? 1,
        contentVersion: parsedCurrent.contentVersion ?? parsedCurrent.seedContentVersion ?? 1,
        appVersion: parsedCurrent.appVersion ?? '2.1.0',
        rawState: rawCurrentState,
      };
      // Bounded single backup slot so localStorage never fills up with unlimited snapshots
      window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(envelope));
      return { ok: true, savedAt };
    } catch {
      // Handle QuotaExceededError gracefully without aborting migration
      return { ok: false };
    }
  }

  async loadAppData(): Promise<BuddyAppData> {
    const seed = createInitialSeedData();
    if (typeof window === 'undefined') {
      return seed;
    }

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const freshSeed: BuddyAppData = {
          ...seed,
          migrationMetadata: {
            appVersion: BUDDY_APP_VERSION,
            contentVersion: SEED_CONTENT_VERSION,
            schemaVersion: BUDDY_DATA_SCHEMA_VERSION,
            lastMigratedAt: new Date().toISOString(),
            lastMigrationStatus: 'fresh_install',
            backupAvailable: false,
            updatedBuiltinTasksCount: seed.tasks.length,
            updatedBuiltinStoriesCount: seed.stories.length,
            updatedBuiltinTopicsCount: seed.growthTopics.length,
            preservedCustomizationsCount: 0,
            conflicts: [],
          },
        };
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSeed));
        } catch {
          // Ignore quota error
        }
        return freshSeed;
      }

      const parsed = JSON.parse(raw) as Partial<BuddyAppData>;
      const prevContentVer = parsed.contentVersion ?? parsed.seedContentVersion ?? 0;
      const prevSchemaVer = parsed.schemaVersion ?? 1;
      const isVersionUpgrade =
        prevContentVer !== SEED_CONTENT_VERSION ||
        prevSchemaVer !== BUDDY_DATA_SCHEMA_VERSION;

      let backupMeta = this.readBackupEnvelope();
      if (isVersionUpgrade) {
        const backupRes = this.writeBoundedBackup(raw, parsed);
        if (backupRes.ok && backupRes.savedAt) {
          backupMeta = {
            savedAt: backupRes.savedAt,
            rawState: raw,
          };
        }
      }

      const { migrated } = runControlledDataMigration(parsed, seed, {
        backupAvailable: Boolean(backupMeta),
        backupCreatedAt: backupMeta?.savedAt,
      });

      // Step 6 & 7: Only persist after validation inside `runControlledDataMigration` succeeds
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } catch {
        // Ignore storage quota errors during automatic migration write
      }

      return migrated;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'MIGRATION_FAILED';
      // Step 8: If migration or parsing fails mid-way, NEVER overwrite `STORAGE_KEY` with a fresh seed!
      // Attempt to recover previous valid data from `raw` or from `BACKUP_STORAGE_KEY`.
      const backup = this.readBackupEnvelope();
      if (backup?.rawState) {
        try {
          const recovered = JSON.parse(backup.rawState) as BuddyAppData;
          if (recovered && recovered.profile && Array.isArray(recovered.tasks)) {
            return {
              ...recovered,
              migrationMetadata: {
                appVersion: recovered.appVersion || BUDDY_APP_VERSION,
                contentVersion: recovered.contentVersion || recovered.seedContentVersion || 1,
                schemaVersion: recovered.schemaVersion || 1,
                lastMigratedAt: new Date().toISOString(),
                lastMigrationStatus: 'failed_kept_previous',
                lastErrorMessage: errorMsg,
                backupAvailable: true,
                backupCreatedAt: backup.savedAt,
                updatedBuiltinTasksCount: 0,
                updatedBuiltinStoriesCount: 0,
                updatedBuiltinTopicsCount: 0,
                preservedCustomizationsCount: 0,
                conflicts: [],
              },
            };
          }
        } catch {
          // Ignore backup parse error
        }
      }

      return {
        ...seed,
        migrationMetadata: {
          appVersion: BUDDY_APP_VERSION,
          contentVersion: SEED_CONTENT_VERSION,
          schemaVersion: BUDDY_DATA_SCHEMA_VERSION,
          lastMigratedAt: new Date().toISOString(),
          lastMigrationStatus: 'failed_kept_previous',
          lastErrorMessage: errorMsg,
          backupAvailable: Boolean(backup),
          backupCreatedAt: backup?.savedAt,
          updatedBuiltinTasksCount: 0,
          updatedBuiltinStoriesCount: 0,
          updatedBuiltinTopicsCount: 0,
          preservedCustomizationsCount: 0,
          conflicts: [],
        },
      };
    }
  }

  async saveAppData(data: BuddyAppData): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const stamped: BuddyAppData = {
        ...data,
        appVersion: data.appVersion || BUDDY_APP_VERSION,
        contentVersion: data.contentVersion || SEED_CONTENT_VERSION,
        schemaVersion: data.schemaVersion || BUDDY_DATA_SCHEMA_VERSION,
        seedContentVersion: data.contentVersion || data.seedContentVersion || SEED_CONTENT_VERSION,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    } catch (err) {
      console.error('Không thể lưu dữ liệu vào bộ nhớ trình duyệt:', err);
    }
  }

  async checkAndSyncContentUpdates(currentData?: BuddyAppData): Promise<{
    data: BuddyAppData;
    updatedCount: number;
    preservedCustomCount: number;
    conflictsCount: number;
    status: MigrationMetadata['lastMigrationStatus'];
  }> {
    const seed = createInitialSeedData();
    const sourceData: Partial<BuddyAppData> = currentData || (await this.loadAppData());
    const backup = this.readBackupEnvelope();

    const result = runControlledDataMigration(sourceData, seed, {
      backupAvailable: Boolean(backup),
      backupCreatedAt: backup?.savedAt,
    });

    await this.saveAppData(result.migrated);

    return {
      data: result.migrated,
      updatedCount:
        result.updatedBuiltinTasksCount +
        result.updatedBuiltinStoriesCount +
        result.updatedBuiltinTopicsCount,
      preservedCustomCount: result.preservedCustomizationsCount,
      conflictsCount: result.conflicts.length,
      status: result.migrated.migrationMetadata?.lastMigrationStatus || 'success',
    };
  }

  async resolveConflict(
    currentData: BuddyAppData,
    conflictId: string,
    resolution: 'preserved_stored' | 'applied_seed'
  ): Promise<BuddyAppData> {
    const nextData = resolveMigrationConflictInMemory(currentData, conflictId, resolution);
    await this.saveAppData(nextData);
    return nextData;
  }

  async restoreFromBackup(): Promise<BuddyAppData | null> {
    if (typeof window === 'undefined') return null;
    const backup = this.readBackupEnvelope();
    if (!backup?.rawState) return null;
    try {
      const parsed = JSON.parse(backup.rawState) as BuddyAppData;
      const check = validateMigratedAppData(parsed);
      if (!check.valid) return null;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch {
      return null;
    }
  }

  getVersionDiagnostics(currentData?: BuddyAppData): VersionDiagnostics {
    const backup = this.readBackupEnvelope();
    let storedAppVer = currentData?.appVersion;
    let storedContentVer = currentData?.contentVersion ?? currentData?.seedContentVersion;
    let storedSchemaVer = currentData?.schemaVersion;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<BuddyAppData>;
          storedAppVer = parsed.appVersion ?? storedAppVer;
          storedContentVer = parsed.contentVersion ?? parsed.seedContentVersion ?? storedContentVer;
          storedSchemaVer = parsed.schemaVersion ?? storedSchemaVer;
        }
      } catch {
        // Ignore parse error
      }
    }

    return {
      appVersion: BUDDY_APP_VERSION,
      bundledContentVersion: SEED_CONTENT_VERSION,
      bundledSchemaVersion: BUDDY_DATA_SCHEMA_VERSION,
      storedAppVersion: storedAppVer,
      storedContentVersion: storedContentVer,
      storedSchemaVersion: storedSchemaVer,
      buildTime: BUDDY_BUILD_TIME,
      gitCommit: BUDDY_GIT_COMMIT_SHORT,
      storageMode: this.getStorageMode(),
      storageKey: STORAGE_KEY,
      backupAvailable: Boolean(backup),
      backupCreatedAt: backup?.savedAt,
      isContentUpToDate: storedContentVer === SEED_CONTENT_VERSION,
      isSchemaUpToDate: storedSchemaVer === BUDDY_DATA_SCHEMA_VERSION,
    };
  }

  async resetToSeedData(): Promise<BuddyAppData> {
    const seed = createInitialSeedData();
    const freshSeed: BuddyAppData = {
      ...seed,
      migrationMetadata: {
        appVersion: BUDDY_APP_VERSION,
        contentVersion: SEED_CONTENT_VERSION,
        schemaVersion: BUDDY_DATA_SCHEMA_VERSION,
        lastMigratedAt: new Date().toISOString(),
        lastMigrationStatus: 'fresh_install',
        backupAvailable: false,
        updatedBuiltinTasksCount: seed.tasks.length,
        updatedBuiltinStoriesCount: seed.stories.length,
        updatedBuiltinTopicsCount: seed.growthTopics.length,
        preservedCustomizationsCount: 0,
        conflicts: [],
      },
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(freshSeed));
    }
    return freshSeed;
  }
}

export const appRepository: IDataRepository = new LocalDemoRepository();
