import {
  GrowthExperienceCustomizableField,
  GrowthExperienceItem,
  GrowthQualityTopic,
  GrowthTopicHeaderCustomizableField,
  ParentApproval,
  Story,
  StoryCustomizableField,
  Task,
  TaskHeaderCustomizableField,
  TaskStep,
  TaskStepCustomizableField,
} from '../types/domain';

/**
 * Normalizes text for safe historical & current seed baseline comparison.
 * Recognizes known system phrasing evolutions across v1.0 -> v2.2:
 * - Leading "Bước 1:", "Bước 2:" prefixes
 * - Legacy pronouns ("con", "bé", "em" -> "bạn", "Buddy" -> "mình")
 * - Vocabulary synonyms used across seed versions ("balo" <-> "cặp")
 * - Punctuation and whitespace variations
 */
export function normalizeForSeedBaselineComparison(rawText: string | undefined | null): string {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .normalize('NFC')
    .replace(/^(?:Bước\s*\d+\s*[:.\-–—]\s*)+/i, '')
    .replace(/^Bé\s+/i, '')
    .replace(/\bbalo\b/gi, 'cặp')
    .replace(/\bcon\b/gi, 'bạn')
    .replace(/\bbé\b/gi, 'bạn')
    .replace(/\bbuddy\b/gi, 'mình')
    .replace(/[!?.…,:;'"“”‘’]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Known historical system seed texts from Buddy v1.0 – v2.0 before v2.1/v2.2 wording upgrades.
 * Ensures that unmodified legacy data in localStorage is recognized as `system_seed`
 * rather than falsely flagged as parent-customized or ambiguous.
 */
const HISTORICAL_STEP_TEXT_SNIPPETS: Record<string, string[]> = {
  'step-bp-1': [
    'xem thời khóa biểu ngày mai',
    'nhìn bảng thời khóa biểu để biết ngày mai học những môn gì',
    'mở thời khóa biểu trên bàn học để xem ngày mai có những môn gì',
    'mình chỉ cần dò cột của ngày mai từ trên xuống dưới',
    'tuyệt lắm bạn đã nắm rõ các môn học ngày mai rồi',
    'xem thời khóa biểu trước giúp chúng mình không bao giờ quên sách vở',
  ],
  'step-bp-2': [
    'lấy sách và vở theo môn học',
    'chọn sách vở và hộp bút đặt lên bàn',
    'tìm sách giáo khoa và vở bài tập của các môn ngày mai đặt lên bàn',
    'xếp sách vào cặp theo môn học',
    'mỗi môn học thường có 1 quyển sách và 1 quyển vở ghi',
  ],
  'step-bp-3': [
    'xếp sách vào cặp ngay ngắn',
    'kiểm tra hộp bút và bình nước rồi kéo khóa cặp',
    'đặt sách to ở phía sau sát lưng cặp vở nhỏ ở phía trước',
    'cất sách vở hộp bút vào cặp và đặt cặp đúng nơi quy định',
  ],
  'step-bp-4': [
    'kiểm tra hộp bút đầy đủ',
    'mở hộp bút kiểm tra bút chì thước kẻ tẩy rồi đặt vào ngăn phụ',
  ],
  'step-bp-5': [
    'đặt cặp ở vị trí phù hợp',
    'để bình nước vào túi hông kéo khóa cặp và đặt ngay ngắn cạnh bàn học',
  ],
  'step-sd-1': [
    'gom bút vào ống đựng',
    'nhặt bút chì bút màu trên mặt bàn và cắm gọn vào ống bút',
  ],
  'step-sd-2': [
    'xếp sách truyện lên kệ',
    'gom các quyển sách truyện đã đọc xong và xếp thẳng hàng lên giá sách',
  ],
  'step-sd-3': [
    'bỏ giấy vụn và lau mặt bàn',
    'bỏ giấy nháp cũ vào sọt rác và dùng khăn mềm lau sạch mặt bàn',
  ],
  'step-ty-1': [
    'cất các khối xếp hình vào hộp',
    'nhặt những mảnh ghép và khối gỗ trên sàn cho vào hộp nhựa',
  ],
  'step-ty-2': [
    'đặt thú bông lên kệ hoặc góc giường',
    'ôm các bạn gấu bông búp bê đặt ngồi ngay ngắn trên kệ đồ chơi',
  ],
  'step-ty-3': [
    'đặt giỏ đồ chơi về góc phòng',
    'đẩy nhẹ giỏ đồ chơi sát vào góc tường cho lối đi rộng rãi',
  ],
  'step-wh-1': [
    'làm ướt tay và lấy xà phòng',
    'mở vòi nước vừa phải làm ướt hai bàn tay và nhấn lấy xà phòng',
  ],
  'step-wh-2': [
    'chà kỹ lòng bàn tay và kẽ ngón tay',
    'xoa đều lòng bàn tay mu bàn tay và đan các ngón tay tạo bọt mịn',
  ],
  'step-wh-3': [
    'xả sạch nước và lau khô bằng khăn',
    'xả sạch bọt dưới vòi nước khóa vòi cẩn thận rồi lau khô tay vào khăn',
  ],
  'step-tp-1': [
    'chọn bộ quần áo đi học ngày mai',
    'lấy sẵn bộ đồng phục hoặc quần áo mặc ngày mai đặt ở nơi dễ lấy',
  ],
  'step-tp-2': [
    'chuẩn bị tất giày và mũ đội đầu',
    'lấy một đôi tất sạch đặt cạnh giày và để sẵn mũ ở kệ gần cửa',
  ],
  'step-tp-3': [
    'điểm danh đồ dùng lần cuối cùng buddy',
    'điểm danh đồ dùng lần cuối cùng mình',
    'nhìn kiểm tra lại cặp sách bình nước và bộ quần áo ngày mai',
  ],
};

const HISTORICAL_TASK_SUBTITLES: Record<string, string[]> = {
  'task-backpack': [
    'sắp xếp sách vở và hộp bút gọn gàng cho ngày học mới',
    'cùng chuẩn bị cặp sách gọn gàng cho ngày mai',
  ],
  'task-study-desk': [
    'giữ mặt bàn sạch thoáng để học bài thật tập trung',
  ],
  'task-toys': [
    'đưa các bạn đồ chơi về đúng giỏ sau giờ vui chơi',
  ],
  'task-wash-hands': [
    'rửa tay sạch bọt xà phòng để bảo vệ sức khỏe mỗi ngày',
  ],
  'task-tomorrow-prep': [
    'soạn sẵn quần áo và mũ nón để buổi sáng thức dậy thật thảnh thơi',
  ],
};

const HISTORICAL_GROWTH_EXPERIENCE_SNIPPETS: Record<string, string[]> = {
  'exp-gratitude-1': [
    'bữa cơm tối thơm lừng của mẹ',
    'tách trà ấm mời bà và mẹ',
    'nhận ra sự vất vả và tình thương của ba mẹ trong từng bữa ăn',
  ],
  'exp-gratitude-2': [
    'lời cảm ơn mang lại điều gì',
    'khi được người thân chuẩn bị món ngon bạn sẽ làm gì',
    'nhìn vào mắt người ấy mỉm cười và nói lời cảm ơn chân thành',
  ],
  'exp-gratitude-3': [
    'trao lời cảm ơn và cốc nước mát hôm nay',
    'nói lời cảm ơn chân thành với ba mẹ hôm nay',
  ],
  'exp-gratitude-4': [
    'cảm xúc của bạn khi nói lời cảm ơn',
  ],
};

/**
 * Checks whether a stored string or string-array value matches either the current
 * seed value or a known historical system seed value (v1.0 -> v2.2).
 */
export function isKnownSystemSeedFieldValue(
  entityType: 'task' | 'task_step' | 'story' | 'growth_topic' | 'growth_experience',
  entityId: string,
  fieldName: string,
  storedValue: unknown,
  currentSeedValue: unknown
): boolean {
  if (storedValue === undefined || storedValue === null || storedValue === '') {
    return true;
  }

  if (Array.isArray(storedValue) && Array.isArray(currentSeedValue)) {
    if (storedValue.length === 0) return true;
    if (storedValue.length === currentSeedValue.length) {
      const allMatch = storedValue.every(
        (item, idx) =>
          normalizeForSeedBaselineComparison(String(item)) ===
          normalizeForSeedBaselineComparison(String(currentSeedValue[idx]))
      );
      if (allMatch) return true;
    }
    return false;
  }

  const normStored = normalizeForSeedBaselineComparison(String(storedValue));
  const normCurrent = normalizeForSeedBaselineComparison(String(currentSeedValue ?? ''));

  if (!normStored) return true;
  if (normStored === normCurrent) return true;

  // Check historical step snippets
  if (entityType === 'task_step') {
    const snippets = HISTORICAL_STEP_TEXT_SNIPPETS[entityId] || [];
    if (snippets.some((sn) => normStored.includes(sn) || sn.includes(normStored))) {
      return true;
    }
    // Also recognize default auto-generated step speech "Bước X: ..."
    if (fieldName === 'buddySpeech' && /^bước\s*\d+/i.test(String(storedValue).trim())) {
      return true;
    }
  }

  if (entityType === 'task' && fieldName === 'subtitle') {
    const subs = HISTORICAL_TASK_SUBTITLES[entityId] || [];
    if (subs.some((sn) => normStored === sn || normStored.includes(sn))) {
      return true;
    }
  }

  if (entityType === 'growth_experience') {
    const snippets = HISTORICAL_GROWTH_EXPERIENCE_SNIPPETS[entityId] || [];
    if (snippets.some((sn) => normStored.includes(sn) || sn.includes(normStored))) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether `parentApprovals` contains an explicit content EDIT record
 * (not a pure approval, reorder, or initial seed approval) for the given target.
 *
 * CRITICAL (Part II.2): Approving content (`actionType === 'approve'` or notes starting
 * with "Phê duyệt" / "Đã duyệt" / "Lưu bản nháp") is NEVER treated as proof of content customization.
 */
export function hasExplicitParentEditRecord(
  parentApprovals: ParentApproval[] | undefined,
  targetType: ParentApproval['targetType'],
  targetId: string,
  fieldName?: string
): boolean {
  if (!Array.isArray(parentApprovals) || parentApprovals.length === 0) {
    return false;
  }

  return parentApprovals.some((a) => {
    if (a.targetType !== targetType || a.targetId !== targetId) return false;
    if (a.id === 'approval-init-1' || a.id === 'approval-init-2') return false;

    // Schema v2 explicit actionType
    if (a.actionType) {
      if (a.actionType !== 'edit' && a.actionType !== 'create' && a.actionType !== 'upload') {
        return false;
      }
      if (fieldName && Array.isArray(a.modifiedFields) && a.modifiedFields.length > 0) {
        return a.modifiedFields.includes(fieldName);
      }
      return true;
    }

    // Legacy Schema v1 records without actionType:
    // Notes like "Phê duyệt nhiệm vụ...", "Đã duyệt...", "Lưu bản nháp..." were created by
    // pure approval buttons and are NOT proof of content editing.
    const note = (a.notes || '').trim().toLowerCase();
    if (note.startsWith('chỉnh sửa') || note.startsWith('tùy chỉnh')) {
      return true;
    }
    return false;
  });
}

/**
 * Maps legacy step IDs (e.g. from older 3-step `task-backpack` or positional steps)
 * to canonical built-in step IDs when safe.
 */
export function findMatchingSeedStep(
  storedStep: TaskStep,
  storedIndex: number,
  storedTotalSteps: number,
  seedTask: Task
): TaskStep | undefined {
  // 1. Direct ID match (primary mechanism - Part V.1)
  const direct = seedTask.steps.find((ss) => ss.id === storedStep.id);
  if (direct) return direct;

  // 2. If explicitly marked as parent-created custom step, do not match to a seed step
  if (
    storedStep.sourceType === 'custom' ||
    storedStep.id.startsWith('step-custom-') ||
    storedStep.id.startsWith('step-new-') ||
    storedStep.id.startsWith('step-ai-')
  ) {
    return undefined;
  }

  // 3. Safe legacy mapping for 3-step `task-backpack` -> 5-step `task-backpack`
  if (seedTask.id === 'task-backpack' && storedTotalSteps < 5) {
    const normTitle = normalizeForSeedBaselineComparison(storedStep.actionTitle);
    if (normTitle.includes('thời khóa biểu') || storedIndex === 0) {
      return seedTask.steps.find((s) => s.id === 'step-bp-1');
    }
    if (normTitle.includes('lấy sách') || normTitle.includes('chọn sách')) {
      return seedTask.steps.find((s) => s.id === 'step-bp-2');
    }
    if (normTitle.includes('xếp sách')) {
      return seedTask.steps.find((s) => s.id === 'step-bp-3');
    }
    if (normTitle.includes('hộp bút') && !normTitle.includes('bình nước')) {
      return seedTask.steps.find((s) => s.id === 'step-bp-4');
    }
    if (normTitle.includes('vị trí') || normTitle.includes('bình nước') || normTitle.includes('kéo khóa')) {
      return seedTask.steps.find((s) => s.id === 'step-bp-5');
    }
  }

  // 4. Match by normalized actionTitle against seed steps
  const normStoredTitle = normalizeForSeedBaselineComparison(storedStep.actionTitle);
  const byTitle = seedTask.steps.find(
    (ss) => normalizeForSeedBaselineComparison(ss.actionTitle) === normStoredTitle
  );
  if (byTitle) return byTitle;

  return undefined;
}

/**
 * Computes exact customized header fields for a Task compared against its canonical seed baseline.
 */
export function computeTaskHeaderCustomizedFields(
  task: Task,
  seedTask: Task
): TaskHeaderCustomizableField[] {
  const prevSet = new Set<TaskHeaderCustomizableField>(task.customizedFields || []);
  const checkFields: TaskHeaderCustomizableField[] = [
    'title',
    'subtitle',
    'category',
    'iconName',
    'themeColor',
    'coverIllustration',
    'estimatedMinutes',
  ];

  const result: TaskHeaderCustomizableField[] = [];
  for (const field of checkFields) {
    const val = task[field];
    const seedVal = seedTask[field];
    const isSameAsSeed =
      typeof val === 'string' && typeof seedVal === 'string'
        ? normalizeForSeedBaselineComparison(val) === normalizeForSeedBaselineComparison(seedVal)
        : val === seedVal;

    if (!isSameAsSeed) {
      result.push(field);
    } else if (prevSet.has(field) && String(val).trim() !== String(seedVal).trim()) {
      result.push(field);
    }
  }
  return result;
}

/**
 * Computes exact customized fields for a TaskStep compared against its canonical seed baseline.
 */
export function computeTaskStepCustomizedFields(
  step: TaskStep,
  seedStep: TaskStep
): TaskStepCustomizableField[] {
  const checkFields: TaskStepCustomizableField[] = [
    'actionTitle',
    'instruction',
    'buddySpeech',
    'simpleExplanation',
    'buddyPraise',
    'illustrationKey',
  ];

  const result: TaskStepCustomizableField[] = [];
  for (const field of checkFields) {
    const val = step[field];
    const seedVal = seedStep[field];
    if (val === undefined || val === null || val === '') continue;

    if (field === 'illustrationKey') {
      if (val !== seedVal) result.push(field);
      continue;
    }

    const isSameAsSeed =
      normalizeForSeedBaselineComparison(String(val)) ===
      normalizeForSeedBaselineComparison(String(seedVal ?? ''));
    if (!isSameAsSeed) {
      result.push(field);
    }
  }
  return result;
}

/**
 * Computes exact customized fields for a built-in Story compared against its canonical seed baseline.
 */
export function computeStoryCustomizedFields(
  story: Story,
  seedStory: Story
): StoryCustomizableField[] {
  const result: StoryCustomizableField[] = [];

  if (
    normalizeForSeedBaselineComparison(story.title) !==
    normalizeForSeedBaselineComparison(seedStory.title)
  ) {
    result.push('title');
  }
  if (
    normalizeForSeedBaselineComparison(story.summary) !==
    normalizeForSeedBaselineComparison(seedStory.summary)
  ) {
    result.push('summary');
  }
  if (
    story.paragraphs.length !== seedStory.paragraphs.length ||
    story.paragraphs.some(
      (p, i) =>
        normalizeForSeedBaselineComparison(p) !==
        normalizeForSeedBaselineComparison(seedStory.paragraphs[i])
    )
  ) {
    result.push('paragraphs');
  }
  if (
    normalizeForSeedBaselineComparison(story.moralLesson) !==
    normalizeForSeedBaselineComparison(seedStory.moralLesson)
  ) {
    result.push('moralLesson');
  }
  if (
    normalizeForSeedBaselineComparison(story.reflectionQuestion) !==
    normalizeForSeedBaselineComparison(seedStory.reflectionQuestion)
  ) {
    result.push('reflectionQuestion');
  }
  if (
    Array.isArray(story.reflectionSuggestions) &&
    (story.reflectionSuggestions.length !== seedStory.reflectionSuggestions.length ||
      story.reflectionSuggestions.some(
        (s, i) =>
          normalizeForSeedBaselineComparison(s) !==
          normalizeForSeedBaselineComparison(seedStory.reflectionSuggestions[i])
      ))
  ) {
    result.push('reflectionSuggestions');
  }
  if (story.category !== seedStory.category) result.push('category');
  if (story.coverTheme !== seedStory.coverTheme) result.push('coverTheme');
  if (story.illustrationType !== seedStory.illustrationType) result.push('illustrationType');

  return result;
}

/**
 * Computes exact customized header fields for a GrowthQualityTopic compared against its canonical seed baseline.
 */
export function computeGrowthTopicHeaderCustomizedFields(
  topic: GrowthQualityTopic,
  seedTopic: GrowthQualityTopic
): GrowthTopicHeaderCustomizableField[] {
  const result: GrowthTopicHeaderCustomizableField[] = [];
  if (
    normalizeForSeedBaselineComparison(topic.title) !==
    normalizeForSeedBaselineComparison(seedTopic.title)
  ) {
    result.push('title');
  }
  if (
    normalizeForSeedBaselineComparison(topic.subtitle) !==
    normalizeForSeedBaselineComparison(seedTopic.subtitle)
  ) {
    result.push('subtitle');
  }
  if (
    normalizeForSeedBaselineComparison(topic.landmarkName) !==
    normalizeForSeedBaselineComparison(seedTopic.landmarkName)
  ) {
    result.push('landmarkName');
  }
  if (topic.themeColor !== seedTopic.themeColor) result.push('themeColor');
  if (topic.illustrationKey !== seedTopic.illustrationKey) result.push('illustrationKey');
  return result;
}

/**
 * Computes exact customized fields for a GrowthExperienceItem compared against its canonical seed baseline.
 */
export function computeGrowthExperienceCustomizedFields(
  exp: GrowthExperienceItem,
  seedExp: GrowthExperienceItem
): GrowthExperienceCustomizableField[] {
  const result: GrowthExperienceCustomizableField[] = [];
  if (
    normalizeForSeedBaselineComparison(exp.title) !==
    normalizeForSeedBaselineComparison(seedExp.title)
  ) {
    result.push('title');
  }
  if (
    normalizeForSeedBaselineComparison(exp.promptOrStory) !==
    normalizeForSeedBaselineComparison(seedExp.promptOrStory)
  ) {
    result.push('promptOrStory');
  }
  if (
    exp.buddySpeech &&
    normalizeForSeedBaselineComparison(exp.buddySpeech) !==
      normalizeForSeedBaselineComparison(seedExp.buddySpeech)
  ) {
    result.push('buddySpeech');
  }
  if (
    Array.isArray(exp.choices) &&
    Array.isArray(seedExp.choices) &&
    (exp.choices.length !== seedExp.choices.length ||
      exp.choices.some(
        (c, i) =>
          normalizeForSeedBaselineComparison(c) !==
          normalizeForSeedBaselineComparison(seedExp.choices?.[i])
      ))
  ) {
    result.push('choices');
  }
  if (
    exp.actionSuggestion &&
    seedExp.actionSuggestion &&
    normalizeForSeedBaselineComparison(exp.actionSuggestion) !==
      normalizeForSeedBaselineComparison(seedExp.actionSuggestion)
  ) {
    result.push('actionSuggestion');
  }
  if (
    normalizeForSeedBaselineComparison(exp.buddyWarmFeedback) !==
    normalizeForSeedBaselineComparison(seedExp.buddyWarmFeedback)
  ) {
    result.push('buddyWarmFeedback');
  }
  return result;
}
