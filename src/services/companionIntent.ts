import {
  BuddyAppData,
  CompanionActionDirective,
} from '../types/domain';
import { getTodayDateKey } from './pointsPolicy';

/**
 * Natural Language Intent Classifier & Action Router for Buddy AI Companion (v1.1).
 * Understands Vietnamese child utterances and maps them to concrete app flows,
 * visual cards, and automatic navigation directives.
 */
export function resolveCompanionIntent(
  rawText: string,
  explicitIntentTag: string | undefined,
  data: BuddyAppData
): {
  directive: CompanionActionDirective;
  suggestedSpokenPrefix?: string;
} {
  const text = rawText.trim().toLowerCase();
  const childName = data.profile.displayName;
  const todayKey = getTodayDateKey();

  // 1) Check "Need Help / Con chưa hiểu" intent first
  if (
    explicitIntentTag === 'need_help' ||
    /(con chưa hiểu|chưa hiểu|khó quá|không biết làm|làm sao|giúp con với|hướng dẫn lại|giải thích lại)/i.test(
      text
    )
  ) {
    // Check if recent conversation mentioned a specific task, otherwise default to Chuẩn bị cặp sách
    const fallbackTask =
      data.tasks.find((t) => text.includes(t.title.toLowerCase())) ||
      data.tasks[0];
    const firstStep = fallbackTask?.steps[0];

    return {
      directive: {
        intent: 'need_help',
        autoNavigate: false,
        taskId: fallbackTask?.id || 'task-backpack',
        targetSubView: {
          type: 'guide-task',
          taskId: fallbackTask?.id || 'task-backpack',
        },
        cardTitle: `Mình giải thích siêu dễ: ${fallbackTask?.title || 'Chuẩn bị cặp sách'}`,
        cardSubtitle:
          firstStep?.actionTitle || 'Làm từng bước nhỏ theo hình vẽ',
        helpExplanation:
          firstStep?.simpleExplanation ||
          'Bạn không cần làm hết một lúc đâu! Mình cùng nhìn bức hình đầu tiên và làm từng bước nhỏ thật vui nhé.',
        illustrationKey:
          fallbackTask?.coverIllustration || 'pack-books',
        ctaLabel: `Mở thẻ hình hướng dẫn ${fallbackTask?.title || 'Chuẩn bị cặp sách'}`,
      },
      suggestedSpokenPrefix: `Đừng lo nhé ${childName}! Để mình giải thích lại thật dễ hiểu bằng thẻ hình cho bạn xem nè: ${
        firstStep?.simpleExplanation ||
        'Bạn chỉ cần thử từng bước nhỏ một thôi, mình cùng bắt đầu từ bước đầu tiên nhé!'
      }`,
    };
  }

  // 2) Check specific task start intent (e.g., "Buddy ơi, mình muốn chuẩn bị cặp sách")
  const taskMatchers: Array<{
    taskId: string;
    keywords: RegExp;
  }> = [
    {
      taskId: 'task-backpack',
      keywords: /(cặp sách|soạn cặp|chuẩn bị cặp|sách vở đi học|xếp sách vào cặp|balo)/i,
    },
    {
      taskId: 'task-study-desk',
      keywords: /(góc học tập|bàn học|dọn bàn|lau bàn|xếp sách lên kệ)/i,
    },
    {
      taskId: 'task-toys',
      keywords: /(đồ chơi|cất đồ chơi|dọn đồ chơi|xếp hình|thú bông|gấu bông)/i,
    },
    {
      taskId: 'task-wash-hands',
      keywords: /(rửa tay|xà phòng|vệ sinh tay|sạch khuẩn)/i,
    },
    {
      taskId: 'task-tomorrow-prep',
      keywords: /(đồ dùng ngày mai|quần áo ngày mai|soạn quần áo|đồng phục|giày mũ)/i,
    },
  ];

  for (const matcher of taskMatchers) {
    if (matcher.keywords.test(text)) {
      const matchedTask =
        data.tasks.find((t) => t.id === matcher.taskId) || data.tasks[0];
      return {
        directive: {
          intent: 'start_task',
          autoNavigate: true,
          taskId: matchedTask.id,
          targetSubView: { type: 'guide-task', taskId: matchedTask.id },
          cardTitle: matchedTask.title,
          cardSubtitle: `${matchedTask.steps.length} thẻ bước hình ảnh · +${matchedTask.starReward} ngôi sao`,
          illustrationKey: matchedTask.coverIllustration,
          ctaLabel: `Bắt đầu: ${matchedTask.title}`,
        },
        suggestedSpokenPrefix: `Tuyệt quá ${childName}! Mình mở ngay thẻ hướng dẫn "${matchedTask.title}" từng bước bằng hình ảnh để chúng mình cùng làm nhé!`,
      };
    }
  }

  // Also check custom parent-created tasks by title
  for (const customTask of data.tasks) {
    if (text.includes(customTask.title.toLowerCase())) {
      return {
        directive: {
          intent: 'start_task',
          autoNavigate: true,
          taskId: customTask.id,
          targetSubView: { type: 'guide-task', taskId: customTask.id },
          cardTitle: customTask.title,
          cardSubtitle: `${customTask.steps.length} bước hình ảnh · +${customTask.starReward} ngôi sao`,
          illustrationKey: customTask.coverIllustration,
          ctaLabel: `Bắt đầu: ${customTask.title}`,
        },
        suggestedSpokenPrefix: `Hay quá ${childName}! Mình cùng mở hướng dẫn "${customTask.title}" ngay bây giờ nhé!`,
      };
    }
  }

  // 3) Check "Listen to Story / Kể chuyện" intent
  if (
    explicitIntentTag === 'listen_story' ||
    explicitIntentTag === 'start_storytelling' ||
    /(kể chuyện|đọc truyện|nghe chuyện|nghe truyện|câu chuyện|tích chu|kiến nhỏ|hạt giống|chim sẻ|bầu trời đêm|đi ngủ)/i.test(
      text
    )
  ) {
    // Check if child asked for a specific story
    const specificStory = data.stories.find(
      (s) =>
        (text.includes('tích chu') && s.id.includes('tich-chu')) ||
        (text.includes('kiến') && s.id.includes('kien')) ||
        (text.includes('hạt giống') && s.id.includes('hat-giong')) ||
        (text.includes('chim sẻ') && s.id.includes('chim-se')) ||
        (text.includes('bầu trời') && s.id.includes('bau-troi'))
    );

    if (specificStory) {
      return {
        directive: {
          intent: 'listen_story',
          autoNavigate: true,
          storyId: specificStory.id,
          targetSubView: { type: 'story-detail', storyId: specificStory.id },
          cardTitle: specificStory.title,
          cardSubtitle: `${specificStory.category} · ${specificStory.durationMinutes} phút`,
          ctaLabel: `Nghe truyện: ${specificStory.title}`,
        },
        suggestedSpokenPrefix: `Có ngay đây ${childName}! Mình mở truyện "${specificStory.title}" để chúng mình cùng lắng nghe nhé!`,
      };
    }

    return {
      directive: {
        intent: 'listen_story',
        autoNavigate: true,
        targetSubView: { type: 'story-list' },
        cardTitle: 'Kho truyện ấm áp mỗi tối',
        cardSubtitle: `${data.stories.length} câu chuyện có tranh minh họa & giọng đọc truyền cảm`,
        ctaLabel: 'Mở Kho truyện của Buddy',
      },
      suggestedSpokenPrefix: `Được chứ ${childName}! Mình cùng ghé Kho truyện mỗi tối để bạn chọn câu chuyện yêu thích nhé!`,
    };
  }

  // 4) Check "Today's Activities / Bắt đầu việc hôm nay" intent
  if (
    explicitIntentTag === 'ask_today_activities' ||
    explicitIntentTag === 'view_routine' ||
    /(việc hôm nay|hoạt động hôm nay|bắt đầu việc|lịch trình hôm nay|hôm nay làm gì|nhiệm vụ hôm nay)/i.test(
      text
    )
  ) {
    const approvedRoutines = data.routines.filter((r) => r.approvedByParent);
    const nextPending = approvedRoutines.find(
      (r) => !r.completedDates.includes(todayKey)
    );
    const linkedTask =
      data.tasks.find((t) => t.id === nextPending?.linkedTaskId) ||
      data.tasks[0];

    return {
      directive: {
        intent: 'ask_today_activities',
        autoNavigate: true,
        targetTab: 'activities',
        taskId: linkedTask?.id,
        cardTitle: nextPending
          ? `Tiếp theo: ${nextPending.title}`
          : `Hoạt động hôm nay của ${childName}`,
        cardSubtitle: linkedTask
          ? `${linkedTask.steps.length} bước minh họa · +${linkedTask.starReward} ngôi sao`
          : 'Khám phá các hoạt động Sáng · Chiều · Tối',
        illustrationKey: linkedTask?.coverIllustration || 'pack-books',
        ctaLabel: 'Mở Việc hôm nay',
      },
      suggestedSpokenPrefix: nextPending
        ? `Hôm nay ${childName} có hoạt động "${nextPending.title}" lúc ${nextPending.dueTime}. Mình mở ngay màn hình Hoạt động để chúng mình cùng bắt đầu nhé!`
        : `Mình mở ngay màn hình Hoạt động hôm nay để ${childName} chọn nhiệm vụ yêu thích nhé!`,
    };
  }

  // 5) Check "Stars & Rewards / Xem sao" intent
  if (
    explicitIntentTag === 'view_stars_rewards' ||
    /(xem sao|ngôi sao|bao nhiêu sao|sao của con|sao của mình|phần thưởng|vòng quay|quà của con|quà của mình|đổi quà)/i.test(
      text
    )
  ) {
    const isWheelRequest = /(vòng quay|quà|phần thưởng)/i.test(text);
    return {
      directive: {
        intent: 'view_stars_rewards',
        autoNavigate: true,
        targetSubView: isWheelRequest
          ? { type: 'rewards-wheel' }
          : { type: 'stars-detail' },
        cardTitle: isWheelRequest
          ? 'Vòng quay Quà tặng Gia đình'
          : `Hũ Sao Nỗ Lực của ${childName}`,
        cardSubtitle: isWheelRequest
          ? 'Quà tặng kỷ niệm ấm áp cùng gia đình'
          : 'Xem những ngôi sao lấp lánh bạn đã tích lũy',
        ctaLabel: isWheelRequest ? 'Mở Vòng quay Quà' : 'Xem Ngôi sao nỗ lực',
      },
      suggestedSpokenPrefix: isWheelRequest
        ? `Mình cùng mở Vòng quay Quà của ${childName} để xem những phần thưởng thú vị nhé!`
        : `Mình đưa ${childName} sang xem Hũ Sao Nỗ Lực lấp lánh của bạn ngay đây!`,
    };
  }

  // 6) Default: Greeting / Discovery Chat
  return {
    directive: {
      intent: 'greeting_chat',
      autoNavigate: false,
    },
  };
}
