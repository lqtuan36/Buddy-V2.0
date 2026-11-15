import assert from 'node:assert/strict';
import {
  BUDDY_APP_VERSION,
  BUDDY_DATA_SCHEMA_VERSION,
  createInitialSeedData,
  SEED_CONTENT_VERSION,
} from '../../data/seedData';
import {
  BACKUP_STORAGE_KEY,
  LocalDemoRepository,
  prepareGrowthTopicForParentSave,
  prepareStoryForParentSave,
  prepareTaskForParentSave,
  resolveMigrationConflictInMemory,
  runControlledDataMigration,
  STORAGE_KEY,
  syncBuiltinAndCustomTasks,
  syncGrowthTopics,
  syncStories,
} from '../repository';
import { BuddyAppData, Story, Task, GrowthQualityTopic } from '../../types/domain';

/**
 * Simple in-memory mock for `window.localStorage` to test full `LocalDemoRepository`
 * lifecycle (fresh install, upgrades, backups, mid-flight failures, multi-browser isolation).
 */
class MockLocalStorage {
  private store = new Map<string, string>();
  public throwOnSetKey: string | null = null;

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSetKey === key) {
      throw new Error('QuotaExceededError');
    }
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

function installMockWindow(storage: MockLocalStorage) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window = {
    localStorage: storage,
  };
}

async function runAllTests() {
  const results: Array<{ id: string; name: string; passed: boolean }> = [];

  async function test(id: string, name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      results.push({ id, name, passed: true });
      console.log(`✅ [PASS] ${id}: ${name}`);
    } catch (err) {
      results.push({ id, name, passed: false });
      console.error(`❌ [FAIL] ${id}: ${name}`, err);
      throw err;
    }
  }

  // =========================================================================
  // CASE 1: Người dùng hoàn toàn mới (Fresh Install)
  // =========================================================================
  await test('TC-01', 'Người dùng hoàn toàn mới nhận đầy đủ seed v2.2 và metadata', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);
    const repo = new LocalDemoRepository();

    const loaded = await repo.loadAppData();
    assert.equal(loaded.appVersion, BUDDY_APP_VERSION);
    assert.equal(loaded.contentVersion, SEED_CONTENT_VERSION);
    assert.equal(loaded.schemaVersion, BUDDY_DATA_SCHEMA_VERSION);
    assert.equal(loaded.migrationMetadata?.lastMigrationStatus, 'fresh_install');
    assert.equal(loaded.tasks.length, createInitialSeedData().tasks.length);
    assert.ok(storage.getItem(STORAGE_KEY), 'State must be persisted in STORAGE_KEY');
  });

  // =========================================================================
  // CASE 2: Người dùng đã có Local Storage từ phiên bản cũ
  // =========================================================================
  await test('TC-02', 'Người dùng có Local Storage từ phiên bản cũ được nâng cấp nội dung chuẩn', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);
    const oldSeed = createInitialSeedData();
    oldSeed.seedContentVersion = 2026111401;
    oldSeed.contentVersion = undefined;
    oldSeed.schemaVersion = 1;
    // Simulate older wording on Step 1 of task-backpack
    oldSeed.tasks[0].steps[0].actionTitle = 'Bước 1: Bé xem thời khóa biểu ngày mai';
    oldSeed.tasks[0].steps[0].buddySpeech = 'Con hãy xem thời khóa biểu ngày mai nhé.';
    oldSeed.tasks[0].customizedByParent = false;
    oldSeed.tasks[0].steps[0].customizedByParent = false;

    storage.setItem(STORAGE_KEY, JSON.stringify(oldSeed));

    const repo = new LocalDemoRepository();
    const migrated = await repo.loadAppData();
    const canonical = createInitialSeedData();

    assert.equal(migrated.contentVersion, SEED_CONTENT_VERSION);
    assert.equal(migrated.schemaVersion, BUDDY_DATA_SCHEMA_VERSION);
    assert.equal(
      migrated.tasks[0].steps[0].actionTitle,
      canonical.tasks[0].steps[0].actionTitle
    );
    assert.equal(
      migrated.tasks[0].steps[0].buddySpeech,
      canonical.tasks[0].steps[0].buddySpeech
    );
    assert.ok(storage.getItem(BACKUP_STORAGE_KEY), 'Backup must be created before version upgrade');
  });

  // =========================================================================
  // CASE 3: Phụ huynh chỉ đổi tên trẻ
  // =========================================================================
  await test('TC-03', 'Phụ huynh chỉ đổi tên trẻ -> giữ nguyên tên trẻ và vẫn nhận nội dung hệ thống mới', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.profile.displayName = 'Bảo Nam';
    stored.profile.nickname = 'Bảo Nam';
    stored.profile.ageYears = 7;
    stored.profile.characterVariant = 'boy';
    stored.tasks[0].steps[0].buddySpeech = 'Câu nói cũ từ phiên bản trước';

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    assert.equal(migrated.profile.displayName, 'Bảo Nam');
    assert.equal(migrated.profile.characterVariant, 'boy');
    assert.equal(
      migrated.tasks[0].steps[0].buddySpeech,
      createInitialSeedData().tasks[0].steps[0].buddySpeech
    );
    assert.equal(migrated.tasks[0].customizedByParent, false);
  });

  // =========================================================================
  // CASE 4: Phụ huynh đổi giọng Buddy
  // =========================================================================
  await test('TC-04', 'Phụ huynh đổi giọng Buddy -> giữ nguyên cấu hình giọng và không ảnh hưởng nguồn gốc nội dung', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.voicePreference = {
      ...stored.voicePreference,
      gender: 'male',
      femaleVoiceId: 'Zephyr',
      speechRate: 1.05,
    };
    stored.tasks[1].steps[0].instruction = 'Hướng dẫn cũ của hệ thống';

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    assert.equal(migrated.voicePreference.gender, 'male');
    assert.equal(migrated.voicePreference.femaleVoiceId, 'Zephyr');
    assert.equal(migrated.voicePreference.speechRate, 1.05);
    assert.equal(
      migrated.tasks[1].steps[0].instruction,
      createInitialSeedData().tasks[1].steps[0].instruction
    );
  });

  // =========================================================================
  // CASE 5: Phụ huynh chỉ phê duyệt nhiệm vụ (Regression: Approval != Customization)
  // =========================================================================
  await test('TC-05', 'Phụ huynh chỉ phê duyệt nhiệm vụ -> KHÔNG đánh dấu customizedByParent và vẫn nhận nội dung mới', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.tasks[0].steps[0].buddySpeech = 'Lời thoại hệ thống cũ trước khi nâng cấp';
    stored.parentApprovals.unshift({
      id: 'approval-parent-only-1',
      targetType: 'task',
      targetId: 'task-backpack',
      status: 'approved',
      actionType: 'approval',
      reviewedBy: 'Phụ huynh',
      reviewedAt: new Date().toISOString(),
      notes: 'Phê duyệt nhiệm vụ Chuẩn bị cặp sách',
    });

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    const bp = migrated.tasks.find((t) => t.id === 'task-backpack')!;
    assert.equal(bp.customizedByParent, false);
    assert.equal(bp.originStatus, 'builtin_approved_only');
    assert.equal(
      bp.steps[0].buddySpeech,
      createInitialSeedData().tasks[0].steps[0].buddySpeech
    );
  });

  // =========================================================================
  // CASE 6: Phụ huynh chỉ phê duyệt chủ đề phẩm chất (hoặc curriculum-batch)
  // =========================================================================
  await test('TC-06', 'Phụ huynh chỉ phê duyệt chủ đề phẩm chất / curriculum-batch -> vẫn nhận cập nhật mới', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.growthTopics[0].experiences[0].buddySpeech = 'Lời dẫn cũ của chặng Lòng biết ơn';
    stored.parentApprovals.unshift({
      id: 'approval-curriculum-batch-test',
      targetType: 'journey',
      targetId: 'curriculum-batch',
      status: 'approved',
      reviewedBy: 'Phụ huynh',
      reviewedAt: new Date().toISOString(),
      notes: 'Phê duyệt lộ trình phẩm chất',
    });

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    const topic = migrated.growthTopics.find((t) => t.id === 'journey-gratitude')!;
    assert.equal(topic.customizedByParent, false);
    assert.equal(topic.originStatus, 'builtin_approved_only');
    assert.equal(
      topic.experiences[0].buddySpeech,
      createInitialSeedData().growthTopics[0].experiences[0].buddySpeech
    );
  });

  // =========================================================================
  // CASE 7: Phụ huynh chỉnh sửa một trường của nhiệm vụ
  // =========================================================================
  await test('TC-07', 'Phụ huynh chỉnh sửa 1 trường (subtitle) của nhiệm vụ -> giữ trường đã sửa, cập nhật các trường khác', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.tasks[0].subtitle = 'Ghi chú riêng của mẹ cho cặp sách Minh Anh';
    stored.tasks[0].customizedByParent = true;
    stored.tasks[0].customizedFields = ['subtitle'];

    const nextSeed = createInitialSeedData();
    nextSeed.tasks[0].title = 'Chuẩn bị cặp sách thông minh (Bản mới)';
    nextSeed.tasks[0].steps[0].buddySpeech = 'Lời thoại mới của nhà phát triển cho Bước 1';

    const { migrated } = runControlledDataMigration(stored, nextSeed);
    const bp = migrated.tasks.find((t) => t.id === 'task-backpack')!;
    assert.equal(bp.subtitle, 'Ghi chú riêng của mẹ cho cặp sách Minh Anh');
    assert.equal(bp.title, 'Chuẩn bị cặp sách thông minh (Bản mới)');
    assert.equal(bp.steps[0].buddySpeech, 'Lời thoại mới của nhà phát triển cho Bước 1');
    assert.equal(bp.customizedByParent, true);
  });

  // =========================================================================
  // CASE 8: Phụ huynh chỉnh sửa một bước trong năm bước
  // =========================================================================
  await test('TC-08', 'Phụ huynh sửa Bước 2 trong 5 bước -> Bước 2 giữ nội dung phụ huynh, Bước 1,3,4,5 nhận nội dung mới', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111401;
    stored.tasks[0].customizedByParent = true;
    stored.tasks[0].steps[1].actionTitle = 'Soạn riêng sách Tiếng Anh và vở Toán theo dặn dò của mẹ';
    stored.tasks[0].steps[1].instruction = 'Mẹ dặn lấy thêm quyển sổ tay màu hồng ở ngăn kéo.';
    stored.tasks[0].steps[1].customizedByParent = true;
    stored.tasks[0].steps[1].customizedFields = ['actionTitle', 'instruction'];

    const nextSeed = createInitialSeedData();
    nextSeed.tasks[0].steps[0].buddySpeech = 'Speech mới Bước 1';
    nextSeed.tasks[0].steps[1].buddyPraise = 'Lời khen mới cho Bước 2';
    nextSeed.tasks[0].steps[2].buddySpeech = 'Speech mới Bước 3';
    nextSeed.tasks[0].steps[3].buddySpeech = 'Speech mới Bước 4';
    nextSeed.tasks[0].steps[4].buddySpeech = 'Speech mới Bước 5';

    const { migrated } = runControlledDataMigration(stored, nextSeed);
    const bp = migrated.tasks.find((t) => t.id === 'task-backpack')!;

    assert.equal(bp.steps[0].buddySpeech, 'Speech mới Bước 1');
    assert.equal(
      bp.steps[1].actionTitle,
      'Soạn riêng sách Tiếng Anh và vở Toán theo dặn dò của mẹ'
    );
    assert.equal(
      bp.steps[1].instruction,
      'Mẹ dặn lấy thêm quyển sổ tay màu hồng ở ngăn kéo.'
    );
    // Unedited field on Step 2 still gets updated!
    assert.equal(bp.steps[1].buddyPraise, 'Lời khen mới cho Bước 2');
    assert.equal(bp.steps[2].buddySpeech, 'Speech mới Bước 3');
    assert.equal(bp.steps[3].buddySpeech, 'Speech mới Bước 4');
    assert.equal(bp.steps[4].buddySpeech, 'Speech mới Bước 5');
  });

  // =========================================================================
  // CASE 9: Phụ huynh tự tạo nhiệm vụ
  // =========================================================================
  await test('TC-09', 'Phụ huynh tự tạo nhiệm vụ riêng -> được bảo toàn 100%', () => {
    const stored = createInitialSeedData();
    const customTask: Task = {
      id: 'task-custom-piano',
      slug: 'tap-dan-piano',
      title: 'Tập đàn Piano 15 phút',
      subtitle: 'Luyện bản nhạc nhỏ mỗi tối cùng mẹ',
      category: 'study',
      iconName: 'Sparkles',
      themeColor: 'lavender',
      coverIllustration: 'schedule-check',
      estimatedMinutes: 15,
      starReward: 3,
      approvalStatus: 'approved',
      lastApprovedAt: new Date().toISOString(),
      sourceType: 'custom',
      customizedByParent: true,
      steps: [
        {
          id: 'step-piano-1',
          stepNumber: 1,
          actionTitle: 'Mở nắp đàn và chỉnh ghế ngồi',
          instruction: 'Ngồi thẳng lưng thoải mái trước phím đàn.',
          simpleExplanation: 'Ngồi đúng tư thế giúp tay lướt phím nhẹ nhàng.',
          buddyPraise: 'Tuyệt lắm nghệ sĩ nhỏ ơi!',
          illustrationKey: 'schedule-check',
        },
      ],
    };
    stored.tasks.push(customTask);

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    const found = migrated.tasks.find((t) => t.id === 'task-custom-piano');
    assert.ok(found, 'Custom parent task must be preserved');
    assert.equal(found.title, 'Tập đàn Piano 15 phút');
    assert.equal(found.originStatus, 'parent_created');
  });

  // =========================================================================
  // CASE 10: Phụ huynh tải lên truyện
  // =========================================================================
  await test('TC-10', 'Phụ huynh tải lên truyện -> được bảo toàn nguyên vẹn qua các bản cập nhật', () => {
    const stored = createInitialSeedData();
    const parentStory: Story = {
      id: 'story-parent-uploaded-1',
      title: 'Chú Mèo Mun thích đọc sách',
      category: 'Truyện Ba Mẹ tải lên',
      summary: 'Truyện mẹ viết riêng cho bé.',
      durationMinutes: 3,
      ageRecommendation: '6–8 tuổi',
      coverTheme: 'mint',
      illustrationType: 'bau-troi-dem',
      paragraphs: ['Đoạn 1 của truyện mẹ tải lên.', 'Đoạn 2 của truyện mẹ tải lên.'],
      moralLesson: 'Đọc sách mỗi ngày mở ra thế giới kỳ diệu.',
      reflectionQuestion: 'Bạn thích nhân vật nào nhất?',
      reflectionSuggestions: ['Chú Mèo Mun', 'Quyển sách phép thuật'],
      approvedByParent: true,
      isParentUploaded: true,
      sourceType: 'docx',
    };
    stored.stories.unshift(parentStory);

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    const found = migrated.stories.find((s) => s.id === 'story-parent-uploaded-1');
    assert.ok(found, 'Parent uploaded story must be preserved');
    assert.equal(found.title, 'Chú Mèo Mun thích đọc sách');
    assert.equal(found.originStatus, 'parent_created');
  });

  // =========================================================================
  // CASE 11: Nhà phát triển thay đổi buddySpeech
  // =========================================================================
  await test('TC-11', 'Nhà phát triển thay đổi buddySpeech -> cập nhật toàn bộ bước chưa tùy chỉnh (không nhầm khác seed mới là tùy chỉnh)', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111402;

    const newSeed = createInitialSeedData();
    newSeed.tasks[1].steps[0].buddySpeech =
      'Lời thoại Buddy hoàn toàn mới do nhà phát triển vừa cập nhật trong v2.2!';

    const { migrated } = runControlledDataMigration(stored, newSeed);
    assert.equal(
      migrated.tasks[1].steps[0].buddySpeech,
      'Lời thoại Buddy hoàn toàn mới do nhà phát triển vừa cập nhật trong v2.2!'
    );
  });

  // =========================================================================
  // CASE 12: Nhà phát triển thay đổi instruction
  // =========================================================================
  await test('TC-12', 'Nhà phát triển thay đổi instruction -> cập nhật đúng mà không bị khóa bởi bộ so sánh cũ', () => {
    const stored = createInitialSeedData();
    stored.seedContentVersion = 2026111402;
    // Even if there was an approval log on this task, instruction must still update!
    stored.parentApprovals.push({
      id: 'approval-study-desk',
      targetType: 'task',
      targetId: 'task-study-desk',
      status: 'approved',
      reviewedBy: 'Phụ huynh',
      reviewedAt: new Date().toISOString(),
    });

    const newSeed = createInitialSeedData();
    newSeed.tasks[1].steps[0].instruction =
      'Hướng dẫn hoàn toàn mới: Gom bút chì, bút màu và thước kẻ cắm ngay ngắn vào ống đựng bút.';

    const { migrated } = runControlledDataMigration(stored, newSeed);
    assert.equal(
      migrated.tasks[1].steps[0].instruction,
      'Hướng dẫn hoàn toàn mới: Gom bút chì, bút màu và thước kẻ cắm ngay ngắn vào ống đựng bút.'
    );
  });

  // =========================================================================
  // CASE 13: Nhà phát triển thêm nhiệm vụ mới
  // =========================================================================
  await test('TC-13', 'Nhà phát triển thêm nhiệm vụ hệ thống mới -> tự động bổ sung vào thư viện không trùng lặp', () => {
    const stored = createInitialSeedData();
    const newSeed = createInitialSeedData();
    newSeed.tasks.push({
      ...newSeed.tasks[0],
      id: 'task-water-plants',
      slug: 'tuoi-cay-ban-cong',
      title: 'Tưới cây nhỏ ngoài ban công',
      sourceType: 'builtin',
    });

    const { migrated } = runControlledDataMigration(stored, newSeed);
    assert.ok(
      migrated.tasks.some((t) => t.id === 'task-water-plants'),
      'Newly added built-in task must be appended'
    );
  });

  // =========================================================================
  // CASE 14: Nhà phát triển thêm truyện mới
  // =========================================================================
  await test('TC-14', 'Nhà phát triển thêm truyện mẫu mới -> mảng stories cũ không ngăn việc bổ sung truyện mới', () => {
    const stored = createInitialSeedData();
    const newSeed = createInitialSeedData();
    newSeed.stories.push({
      ...newSeed.stories[0],
      id: 'story-new-sample-v22',
      title: 'Chú Sóc Nâu biết chia sẻ hạt dẻ',
      sourceType: 'builtin',
    });

    const { migrated } = runControlledDataMigration(stored, newSeed);
    assert.ok(
      migrated.stories.some((s) => s.id === 'story-new-sample-v22'),
      'Newly added seed story must be appended to existing stories array'
    );
  });

  // =========================================================================
  // CASE 15: Nhà phát triển thêm chủ đề phẩm chất mới
  // =========================================================================
  await test('TC-15', 'Nhà phát triển thêm chủ đề phẩm chất mới -> tự động bổ sung vào growthTopics', () => {
    const stored = createInitialSeedData();
    // Simulate older stored state with only 3 topics
    stored.growthTopics = stored.growthTopics.slice(0, 3);

    const newSeed = createInitialSeedData();
    const { migrated } = runControlledDataMigration(stored, newSeed);
    assert.equal(
      migrated.growthTopics.length,
      newSeed.growthTopics.length,
      'Missing built-in growth topics must be appended'
    );
  });

  // =========================================================================
  // CASE 16: Một nhiệm vụ thay đổi từ 3 bước sang 5 bước (task-backpack regression test)
  // =========================================================================
  await test('TC-16', 'Regression task-backpack: Nhiệm vụ 3 bước nâng lên 5 bước bảo toàn Bước 2 phụ huynh đã sửa và bổ sung Bước 4, 5', () => {
    const canonicalSeed = createInitialSeedData();
    const legacyState = createInitialSeedData();
    legacyState.seedContentVersion = 2026110101;

    // Construct a legacy 3-step `task-backpack` where Step 2 was customized by parent
    const legacyBackpack = legacyState.tasks.find((t) => t.id === 'task-backpack')!;
    legacyBackpack.customizedByParent = true;
    legacyBackpack.steps = [
      {
        ...legacyBackpack.steps[0],
        actionTitle: 'Bước 1: Xem thời khóa biểu',
        customizedByParent: false,
      },
      {
        ...legacyBackpack.steps[1],
        actionTitle: 'Lấy vở Toán và hộp phấn màu theo dặn dò riêng của ba',
        instruction: 'Ba dặn thứ Tư nhớ mang thêm bộ thẻ học Toán.',
        customizedByParent: true,
        customizedFields: ['actionTitle', 'instruction'],
      },
      {
        ...legacyBackpack.steps[2],
        actionTitle: 'Bước 3: Cho sách vở vào balo',
        customizedByParent: false,
      },
    ];

    const { migrated } = runControlledDataMigration(legacyState, canonicalSeed);
    const syncedBp = migrated.tasks.find((t) => t.id === 'task-backpack')!;

    assert.equal(syncedBp.steps.length, 5, 'Must upgrade from 3 steps to 5 steps');
    // Step 1 updated to canonical seed
    assert.equal(
      syncedBp.steps[0].actionTitle,
      canonicalSeed.tasks[0].steps[0].actionTitle
    );
    // Step 2 preserved parent customization!
    assert.equal(
      syncedBp.steps[1].actionTitle,
      'Lấy vở Toán và hộp phấn màu theo dặn dò riêng của ba'
    );
    assert.equal(
      syncedBp.steps[1].instruction,
      'Ba dặn thứ Tư nhớ mang thêm bộ thẻ học Toán.'
    );
    assert.equal(syncedBp.steps[1].customizedByParent, true);
    // Step 3 updated to canonical seed
    assert.equal(
      syncedBp.steps[2].actionTitle,
      canonicalSeed.tasks[0].steps[2].actionTitle
    );
    // Steps 4 & 5 appended from canonical seed
    assert.equal(syncedBp.steps[3].id, 'step-bp-4');
    assert.equal(syncedBp.steps[4].id, 'step-bp-5');
  });

  // =========================================================================
  // CASE 17: Trẻ đã có sao và tiến độ
  // =========================================================================
  await test('TC-17', 'Trẻ đã có sao, lịch sử hoàn thành nhiệm vụ, tiến độ Hành trình -> bảo toàn 100%', () => {
    const stored = createInitialSeedData();
    stored.starLedger.unshift({
      id: 'star-earned-custom-99',
      childId: 'child-minh-anh',
      dateKey: '2026-11-15',
      monthKey: '2026-11',
      amount: 5,
      sourceType: 'parent_encouragement',
      sourceId: 'praise-99',
      idempotencyKey: 'praise-99',
      title: 'Tự giác giúp mẹ gấp quần áo',
      note: 'Rất ngoan',
      createdAt: new Date().toISOString(),
    });
    stored.growthTopics[1].experiences[0].status = 'experienced';
    stored.growthTopics[1].experiences[0].childResponse = 'Mình sẽ nói thật ngay với mẹ ạ!';

    const { migrated } = runControlledDataMigration(stored, createInitialSeedData());
    assert.ok(
      migrated.starLedger.some((tx) => tx.id === 'star-earned-custom-99'),
      'Earned star transaction must be preserved'
    );
    const honestyTopic = migrated.growthTopics.find((t) => t.id === 'journey-honesty')!;
    assert.equal(honestyTopic.experiences[0].status, 'experienced');
    assert.equal(
      honestyTopic.experiences[0].childResponse,
      'Mình sẽ nói thật ngay với mẹ ạ!'
    );
  });

  // =========================================================================
  // CASE 18: Migration được chạy nhiều lần (Idempotency)
  // =========================================================================
  await test('TC-18', 'Migration chạy lặp lại nhiều lần (Idempotent) không làm nhân đôi hoặc mất dữ liệu', () => {
    const initial = createInitialSeedData();
    initial.seedContentVersion = 2026111401;

    const run1 = runControlledDataMigration(initial, createInitialSeedData()).migrated;
    const run2 = runControlledDataMigration(run1, createInitialSeedData()).migrated;
    const run3 = runControlledDataMigration(run2, createInitialSeedData()).migrated;

    assert.equal(run1.tasks.length, run3.tasks.length);
    assert.equal(run1.stories.length, run3.stories.length);
    assert.equal(run1.growthTopics.length, run3.growthTopics.length);
    assert.equal(run1.starLedger.length, run3.starLedger.length);
    assert.equal(run1.taskRuns.length, run3.taskRuns.length);
    assert.equal(run3.migrationMetadata?.lastMigrationStatus, 'no_op_up_to_date');
  });

  // =========================================================================
  // CASE 19: Migration thất bại giữa chừng (Fault Tolerance & Backup Recovery)
  // =========================================================================
  await test('TC-19', 'Khi dữ liệu hỏng hoặc migration lỗi giữa chừng -> khôi phục an toàn bản sao lưu trước đó', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);
    const validPrevious = createInitialSeedData();
    validPrevious.profile.displayName = 'Bé An Nhiên';
    validPrevious.seedContentVersion = 2026111401;

    // Save a valid backup envelope and simulate a corrupted main state during interrupted write
    storage.setItem(
      BACKUP_STORAGE_KEY,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        schemaVersion: 1,
        contentVersion: 2026111401,
        rawState: JSON.stringify(validPrevious),
      })
    );
    storage.setItem(STORAGE_KEY, '{ corrupted json payload ...');

    const repo = new LocalDemoRepository();
    const recovered = await repo.loadAppData();
    assert.equal(recovered.profile.displayName, 'Bé An Nhiên');
    assert.equal(
      recovered.migrationMetadata?.lastMigrationStatus,
      'failed_kept_previous'
    );
    assert.equal(recovered.migrationMetadata?.backupAvailable, true);
  });

  // =========================================================================
  // CASE 20: Trường hợp nguồn gốc nội dung cũ không thể xác định (Legacy Unresolved + Conflict Resolution)
  // =========================================================================
  await test('TC-20', 'Nội dung cũ không có version/flag và khác hoàn toàn baseline -> giữ nguyên trạng thái legacy_unresolved và tạo conflict để phụ huynh chọn', () => {
    const unversionedLegacy = createInitialSeedData();
    // Strip all version metadata and customized flags to simulate unknown historical origin
    delete unversionedLegacy.seedContentVersion;
    delete unversionedLegacy.contentVersion;
    delete unversionedLegacy.schemaVersion;
    delete unversionedLegacy.tasks[0].contentVersion;
    delete unversionedLegacy.tasks[0].baseContentVersion;
    delete unversionedLegacy.tasks[0].customizedByParent;
    delete unversionedLegacy.tasks[0].steps[0].contentVersion;
    delete unversionedLegacy.tasks[0].steps[0].baseContentVersion;
    delete unversionedLegacy.tasks[0].steps[0].customizedByParent;

    unversionedLegacy.tasks[0].steps[0].instruction =
      'Nội dung đặc biệt không rõ nguồn gốc từ bản thử nghiệm rất cũ.';

    const { migrated, conflicts } = runControlledDataMigration(
      unversionedLegacy,
      createInitialSeedData()
    );

    const step0 = migrated.tasks[0].steps[0];
    assert.equal(
      step0.instruction,
      'Nội dung đặc biệt không rõ nguồn gốc từ bản thử nghiệm rất cũ.',
      'Must NOT blindly overwrite unknown origin text'
    );
    assert.equal(step0.customizedByParent, false, 'Must NOT falsely claim parent customized it');
    assert.equal(step0.originStatus, 'legacy_unresolved');
    assert.ok(
      conflicts.some((c) => c.entityId === 'step-bp-1' && c.field === 'instruction'),
      'Must report conflict in migrationMetadata.conflicts'
    );

    // Verify parent can resolve conflict by applying new Buddy seed
    const conflictId = conflicts.find(
      (c) => c.entityId === 'step-bp-1' && c.field === 'instruction'
    )!.id;
    const resolved = resolveMigrationConflictInMemory(
      migrated,
      conflictId,
      'applied_seed',
      createInitialSeedData()
    );
    assert.equal(
      resolved.tasks[0].steps[0].instruction,
      createInitialSeedData().tasks[0].steps[0].instruction
    );
    assert.equal(resolved.migrationMetadata?.conflicts.length, 0);
  });

  // =========================================================================
  // CASE 21: Hai trình duyệt có dữ liệu cục bộ khác nhau
  // =========================================================================
  await test('TC-21', 'Hai trình duyệt có Local Storage khác nhau đồng bộ độc lập và chính xác', async () => {
    const browserAStorage = new MockLocalStorage();
    const browserBStorage = new MockLocalStorage();

    // Browser A: Parent customized task-study-desk title
    const stateA = createInitialSeedData();
    stateA.seedContentVersion = 2026111401;
    stateA.tasks[1].title = 'Góc học tập siêu gọn của Bin';
    stateA.tasks[1].customizedByParent = true;
    stateA.tasks[1].customizedFields = ['title'];
    browserAStorage.setItem(STORAGE_KEY, JSON.stringify(stateA));

    // Browser B: Unmodified old seed
    const stateB = createInitialSeedData();
    stateB.seedContentVersion = 2026111401;
    stateB.tasks[1].title = 'Dọn góc học tập';
    stateB.tasks[1].customizedByParent = false;
    browserBStorage.setItem(STORAGE_KEY, JSON.stringify(stateB));

    installMockWindow(browserAStorage);
    const repoA = new LocalDemoRepository();
    const loadedA = await repoA.loadAppData();

    installMockWindow(browserBStorage);
    const repoB = new LocalDemoRepository();
    const loadedB = await repoB.loadAppData();

    assert.equal(loadedA.tasks[1].title, 'Góc học tập siêu gọn của Bin');
    assert.equal(loadedB.tasks[1].title, createInitialSeedData().tasks[1].title);
  });

  // =========================================================================
  // CASE 22: Build mới đã deploy vs Kiểm tra trạng thái phiên bản (VersionDiagnostics)
  // =========================================================================
  await test('TC-22', 'VersionDiagnostics phân biệt rõ Bundled Version và Stored Version, hỗ trợ nút Kiểm tra cập nhật nội dung', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);
    const staleStored = createInitialSeedData();
    staleStored.contentVersion = 2026111401;
    staleStored.seedContentVersion = 2026111401;
    staleStored.schemaVersion = 1;
    storage.setItem(STORAGE_KEY, JSON.stringify(staleStored));

    const repo = new LocalDemoRepository();
    const diagBefore = repo.getVersionDiagnostics(staleStored);
    assert.equal(diagBefore.isContentUpToDate, false);
    assert.equal(diagBefore.isSchemaUpToDate, false);
    assert.equal(diagBefore.bundledContentVersion, SEED_CONTENT_VERSION);
    assert.equal(diagBefore.storedContentVersion, 2026111401);

    const syncRes = await repo.checkAndSyncContentUpdates();
    const diagAfter = repo.getVersionDiagnostics(syncRes.data);
    assert.equal(diagAfter.isContentUpToDate, true);
    assert.equal(diagAfter.isSchemaUpToDate, true);
    assert.equal(diagAfter.storedContentVersion, SEED_CONTENT_VERSION);
  });

  // =========================================================================
  // CASE 23 (Hardening #1): Phụ huynh chỉ phê duyệt nội dung cũ
  // =========================================================================
  await test('TC-23', 'Phụ huynh chỉ bấm phê duyệt nội dung cũ (khác seedData mới nhất) -> KHÔNG tạo customization metadata', () => {
    const existingData = createInitialSeedData();
    // Simulate older stored task, topic, and story that differ from the newest `seedData.ts`
    const oldTask: Task = {
      ...existingData.tasks[0],
      subtitle: 'Mô tả hệ thống từ phiên bản trước',
      customizedByParent: false,
      customizedFields: [],
      steps: existingData.tasks[0].steps.map((s, idx) =>
        idx === 0
          ? {
              ...s,
              actionTitle: 'Bước 1: Xem thời khóa biểu',
              buddySpeech: 'Lời thoại hệ thống cũ của Bước 1',
              customizedByParent: false,
              customizedFields: [],
            }
          : s
      ),
    };

    const taskSave = prepareTaskForParentSave(oldTask, { ...oldTask }, 'approved');
    assert.equal(taskSave.actionType, 'approval');
    assert.deepEqual(taskSave.sessionEditedFields, []);
    assert.equal(taskSave.stampedTask.customizedByParent, false);
    assert.deepEqual(taskSave.stampedTask.customizedFields, []);
    assert.equal(taskSave.stampedTask.steps[0].customizedByParent, false);
    assert.deepEqual(taskSave.stampedTask.steps[0].customizedFields, []);
    assert.equal(taskSave.stampedTask.originStatus, 'builtin_approved_only');

    const oldTopic: GrowthQualityTopic = {
      ...existingData.growthTopics[0],
      subtitle: 'Mô tả cũ của chặng Lòng biết ơn',
      customizedByParent: false,
      customizedFields: [],
    };
    const topicSave = prepareGrowthTopicForParentSave(oldTopic, {
      ...oldTopic,
      approvalStatus: 'approved',
    });
    assert.equal(topicSave.actionType, 'approval');
    assert.deepEqual(topicSave.sessionEditedFields, []);
    assert.equal(topicSave.stampedTopic.customizedByParent, false);
    assert.deepEqual(topicSave.stampedTopic.customizedFields, []);

    const oldStory: Story = {
      ...existingData.stories[0],
      summary: 'Tóm tắt cũ từ bản trước',
      customizedByParent: false,
      customizedFields: [],
    };
    const storySave = prepareStoryForParentSave(oldStory, {
      ...oldStory,
      approvedByParent: true,
    });
    assert.equal(storySave.actionType, 'approval');
    assert.deepEqual(storySave.sessionEditedFields, []);
    assert.equal(storySave.stampedStory.customizedByParent, false);
    assert.deepEqual(storySave.stampedStory.customizedFields, []);
  });

  // =========================================================================
  // CASE 24 (Hardening #2): Phụ huynh mở và lưu biểu mẫu mà không chỉnh sửa
  // =========================================================================
  await test('TC-24', 'Phụ huynh mở biểu mẫu và bấm Lưu mà không sửa trường nào -> giữ nguyên trạng thái gốc, không phát sinh customization', () => {
    const existingTask = createInitialSeedData().tasks[1];
    existingTask.steps[0].instruction = 'Hướng dẫn hệ thống từ bản trước khi mở form';
    existingTask.customizedByParent = false;
    existingTask.customizedFields = [];
    existingTask.steps[0].customizedByParent = false;
    existingTask.steps[0].customizedFields = [];

    // Form clone submitted without any edits
    const formClone: Task = JSON.parse(JSON.stringify(existingTask));
    const res = prepareTaskForParentSave(existingTask, formClone, 'approved');

    assert.equal(res.actionType, 'approval');
    assert.deepEqual(res.sessionEditedFields, []);
    assert.equal(res.stampedTask.customizedByParent, false);
    assert.equal(res.stampedTask.steps[0].customizedByParent, false);
    assert.deepEqual(res.stampedTask.steps[0].customizedFields, []);
  });

  // =========================================================================
  // CASE 25 (Hardening #3): Phụ huynh chỉnh sửa 1 trường duy nhất trong biểu mẫu có nội dung cũ
  // =========================================================================
  await test('TC-25', 'Phụ huynh chỉ sửa 1 trường trong biểu mẫu chứa nội dung cũ -> chỉ đánh dấu đúng 1 trường đó là tùy chỉnh', () => {
    const existingTask = createInitialSeedData().tasks[0];
    // Suppose both actionTitle and buddySpeech had older text before opening the form
    existingTask.steps[0].actionTitle = 'Bước 1: Xem thời khóa biểu ngày mai';
    existingTask.steps[0].buddySpeech = 'Lời thoại hệ thống cũ trước khi mở form';
    existingTask.steps[0].customizedByParent = false;
    existingTask.steps[0].customizedFields = [];

    // Parent opens form and ONLY edits `instruction` on Step 1
    const formEdited: Task = JSON.parse(JSON.stringify(existingTask));
    formEdited.steps[0].instruction =
      'Mẹ dặn Minh Anh nhìn thời khóa biểu dán ở góc phải bàn học nhé!';

    const saveRes = prepareTaskForParentSave(existingTask, formEdited, 'approved');
    assert.equal(saveRes.actionType, 'customization');
    assert.deepEqual(saveRes.sessionEditedFields, ['step-bp-1.instruction']);
    assert.equal(saveRes.stampedTask.steps[0].customizedByParent, true);
    assert.deepEqual(
      saveRes.stampedTask.steps[0].customizedFields,
      ['instruction'],
      'Only the edited field (instruction) may be marked customized; actionTitle and buddySpeech must NOT be marked!'
    );

    // And when migration runs next, `actionTitle` and `buddySpeech` receive the new seed while `instruction` is preserved!
    const storedAfterSave = createInitialSeedData();
    storedAfterSave.tasks[0] = saveRes.stampedTask;
    const { migrated } = runControlledDataMigration(storedAfterSave, createInitialSeedData());
    assert.equal(
      migrated.tasks[0].steps[0].instruction,
      'Mẹ dặn Minh Anh nhìn thời khóa biểu dán ở góc phải bàn học nhé!'
    );
    assert.equal(
      migrated.tasks[0].steps[0].actionTitle,
      createInitialSeedData().tasks[0].steps[0].actionTitle
    );
    assert.equal(
      migrated.tasks[0].steps[0].buddySpeech,
      createInitialSeedData().tasks[0].steps[0].buddySpeech
    );
  });

  // =========================================================================
  // CASE 26 (Hardening #4): Migration thành công trong bộ nhớ nhưng localStorage.setItem thất bại
  // =========================================================================
  await test('TC-26', 'Migration hợp lệ trong bộ nhớ nhưng localStorage.setItem thất bại -> KHÔNG báo Đã đồng bộ, giữ dữ liệu gốc và cho phép thử lại', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);

    const oldState = createInitialSeedData();
    oldState.contentVersion = 2026111401;
    oldState.seedContentVersion = 2026111401;
    oldState.schemaVersion = 1;
    const rawOldJson = JSON.stringify(oldState);
    storage.setItem(STORAGE_KEY, rawOldJson);

    // Simulate QuotaExceededError when writing migrated state to STORAGE_KEY
    storage.throwOnSetKey = STORAGE_KEY;

    const repo = new LocalDemoRepository();
    const loaded = await repo.loadAppData();
    const diagFailed = repo.getVersionDiagnostics(loaded);

    assert.equal(loaded.migrationMetadata?.lastMigrationStatus, 'storage_write_failed');
    assert.equal(loaded.migrationMetadata?.persistedToStorage, false);
    assert.equal(
      diagFailed.isContentUpToDate,
      false,
      'Must NOT report isContentUpToDate = true when localStorage write failed'
    );
    assert.equal(diagFailed.persistedToStorage, false);
    assert.equal(
      storage.getItem(STORAGE_KEY),
      rawOldJson,
      'Original stored state in STORAGE_KEY must remain intact'
    );

    // Clear write failure and retry via checkAndSyncContentUpdates
    storage.throwOnSetKey = null;
    const retryRes = await repo.checkAndSyncContentUpdates(loaded);
    const diagAfterRetry = repo.getVersionDiagnostics(retryRes.data);

    assert.equal(retryRes.status, 'no_op_up_to_date');
    assert.equal(diagAfterRetry.persistedToStorage, true);
    assert.equal(diagAfterRetry.isContentUpToDate, true);
  });

  // =========================================================================
  // CASE 27 (Hardening #5): Dữ liệu JSON hỏng nhưng không có backup
  // =========================================================================
  await test('TC-27', 'Dữ liệu JSON hỏng nhưng KHÔNG có backup -> KHÔNG ghi đè khóa gốc bằng seed mặc định và chặn saveAppData ghi đè', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);

    const rawCorrupted = '{"profile":{"displayName":"Bé Gia Huy"}, CORRUPTED_JSON_WITHOUT_BACKUP';
    storage.setItem(STORAGE_KEY, rawCorrupted);

    const repo = new LocalDemoRepository();
    const loaded = await repo.loadAppData();
    const diag = repo.getVersionDiagnostics(loaded);

    assert.equal(loaded.migrationMetadata?.lastMigrationStatus, 'corrupted_unrecoverable');
    assert.equal(loaded.migrationMetadata?.storageReadOnlyRecoveryMode, true);
    assert.equal(diag.storageReadOnlyRecoveryMode, true);
    assert.equal(diag.isContentUpToDate, false);
    assert.equal(
      storage.getItem(STORAGE_KEY),
      rawCorrupted,
      'loadAppData must NOT overwrite corrupted STORAGE_KEY with seed'
    );

    // Even if application calls saveAppData while in corrupted read-only mode, STORAGE_KEY must NOT be overwritten
    await repo.saveAppData(loaded);
    assert.equal(
      storage.getItem(STORAGE_KEY),
      rawCorrupted,
      'saveAppData must NOT overwrite corrupted STORAGE_KEY while in protection mode'
    );
  });

  // =========================================================================
  // CASE 28 (Hardening #6): Nội dung cũ đã được đánh dấu sai là customized vẫn nhận được nội dung mới
  // =========================================================================
  await test('TC-28', 'Nội dung cũ bị đánh dấu sai customizedByParent: true (do lỗi phê duyệt cũ) tự phục hồi và nhận nội dung mới', () => {
    const legacyFalseCustom = createInitialSeedData();
    legacyFalseCustom.seedContentVersion = 2026111401;
    // Simulate legacy false-positive `customizedByParent: true` (without customizedFields) from old approval flow
    legacyFalseCustom.tasks[0].customizedByParent = true;
    delete legacyFalseCustom.tasks[0].customizedFields;
    legacyFalseCustom.tasks[0].steps[0].actionTitle = 'Bước 1: Xem thời khóa biểu ngày mai';
    legacyFalseCustom.tasks[0].steps[0].buddySpeech = 'Lời thoại hệ thống cũ của Bước 1';
    legacyFalseCustom.tasks[0].steps[0].customizedByParent = true;
    delete legacyFalseCustom.tasks[0].steps[0].customizedFields;
    legacyFalseCustom.parentApprovals.unshift({
      id: 'approval-legacy-false-positive',
      targetType: 'task',
      targetId: 'task-backpack',
      status: 'approved',
      reviewedBy: 'Phụ huynh',
      reviewedAt: new Date().toISOString(),
      notes: 'Phê duyệt nhiệm vụ Chuẩn bị cặp sách',
    });

    const canonical = createInitialSeedData();
    const { migrated } = runControlledDataMigration(legacyFalseCustom, canonical);
    const bp = migrated.tasks.find((t) => t.id === 'task-backpack')!;

    assert.equal(bp.customizedByParent, false, 'False positive customizedByParent must be healed');
    assert.equal(bp.steps[0].customizedByParent, false);
    assert.equal(bp.steps[0].actionTitle, canonical.tasks[0].steps[0].actionTitle);
    assert.equal(bp.steps[0].buddySpeech, canonical.tasks[0].steps[0].buddySpeech);
  });

  // =========================================================================
  // CASE 29 (Hardening #7): Khôi phục backup bảo toàn sao và tiến độ
  // =========================================================================
  await test('TC-29', 'Khôi phục từ bản sao lưu (restoreFromBackup) bảo toàn 100% sao, lịch sử nhiệm vụ và tiến độ của trẻ', async () => {
    const storage = new MockLocalStorage();
    installMockWindow(storage);

    const preUpgradeState = createInitialSeedData();
    preUpgradeState.contentVersion = 2026111401;
    preUpgradeState.seedContentVersion = 2026111401;
    preUpgradeState.schemaVersion = 1;
    preUpgradeState.profile.displayName = 'Khánh Ngân';
    preUpgradeState.starLedger.unshift({
      id: 'star-backup-preserve-1',
      childId: 'child-minh-anh',
      dateKey: '2026-11-15',
      monthKey: '2026-11',
      amount: 7,
      sourceType: 'task_completion',
      sourceId: 'task-backpack',
      idempotencyKey: 'backup-star-1',
      title: 'Hoàn thành xuất sắc',
      note: 'Bảo toàn qua backup',
      createdAt: new Date().toISOString(),
    });
    preUpgradeState.growthTopics[0].experiences[0].status = 'experienced';
    preUpgradeState.growthTopics[0].experiences[0].childResponse = 'Con cảm ơn mẹ đã nấu cơm ngon!';

    storage.setItem(STORAGE_KEY, JSON.stringify(preUpgradeState));

    const repo = new LocalDemoRepository();
    // 1. Trigger version upgrade which automatically writes bounded backup
    await repo.loadAppData();
    assert.ok(storage.getItem(BACKUP_STORAGE_KEY), 'Pre-migration backup must exist');

    // 2. Restore from backup and verify 100% of stars and progress
    const restored = await repo.restoreFromBackup();
    assert.ok(restored, 'restoreFromBackup must return restored state');
    assert.equal(restored.profile.displayName, 'Khánh Ngân');
    assert.ok(restored.starLedger.some((tx) => tx.id === 'star-backup-preserve-1' && tx.amount === 7));
    assert.equal(restored.growthTopics[0].experiences[0].status, 'experienced');
    assert.equal(
      restored.growthTopics[0].experiences[0].childResponse,
      'Con cảm ơn mẹ đã nấu cơm ngon!'
    );
  });

  console.log(`\n🎉 ALL ${results.length}/29 MANDATORY MIGRATION & HARDENING TESTS PASSED!`);
}

runAllTests().catch((err) => {
  console.error('Migration test suite failed:', err);
  process.exit(1);
});
