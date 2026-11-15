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

  console.log(`\n🎉 ALL ${results.length}/22 MANDATORY MIGRATION & VERSIONING TESTS PASSED!`);
}

runAllTests().catch((err) => {
  console.error('Migration test suite failed:', err);
  process.exit(1);
});
