import { BuddyAppData } from '../types/domain';

export type CompanionIntentType =
  | 'start_task'
  | 'today_activities'
  | 'tell_story'
  | 'need_help'
  | 'view_stars_rewards'
  | 'open_journey'
  | 'greeting_or_chat';

export interface CompanionDetectedAction {
  intent: CompanionIntentType;
  autoNavigate: boolean;
  targetTab?: 'home' | 'activities' | 'journey' | 'profile';
  targetSubView?:
    | { type: 'guide-task'; taskId: string; routineId?: string }
    | { type: 'story-list' }
    | { type: 'story-detail'; storyId: string }
    | { type: 'stars-detail' }
    | { type: 'rewards-wheel' };
  actionLabel: string;
  taskId?: string;
  storyId?: string;
  topicId?: string;
  helpTopicTaskId?: string;
  suggestedReply: string;
}

/**
 * Natural Language Intent Detector & Action Router for Vietnamese Kids (v1.3).
 * Ensures that when a child speaks or types a request in the Floating Buddy Assistant,
 * Buddy understands the intent, responds naturally with voice, and leads the child directly
 * to the right screen, task step guide, story player, or Growth Journey topic.
 */
export function resolveCompanionIntent(
  rawText: string,
  data: BuddyAppData,
  explicitIntentTag?: string
): CompanionDetectedAction {
  const text = rawText.trim().toLowerCase();
  const childName = data.profile.displayName;

  // 1. Check specific task matches first ("chuẩn bị cặp sách", "dọn góc học tập", "cất đồ chơi", "rửa tay", "quần áo")
  const matchTaskByKeywords = (): string | null => {
    if (
      text.includes('cặp sách') ||
      text.includes('soạn cặp') ||
      text.includes('sách vở') ||
      text.includes('đi học') ||
      text.includes('balo')
    ) {
      return 'task-backpack';
    }
    if (
      text.includes('bàn học') ||
      text.includes('góc học tập') ||
      text.includes('dọn bàn')
    ) {
      return 'task-study-desk';
    }
    if (
      text.includes('đồ chơi') ||
      text.includes('thú bông') ||
      text.includes('xếp hình')
    ) {
      return 'task-toys';
    }
    if (
      text.includes('rửa tay') ||
      text.includes('xà phòng') ||
      text.includes('vệ sinh tay')
    ) {
      return 'task-wash-hands';
    }
    if (
      text.includes('quần áo') ||
      text.includes('đồng phục') ||
      text.includes('mũ') ||
      text.includes('giày')
    ) {
      return 'task-tomorrow-prep';
    }
    return null;
  };

  // 2. Check NEED HELP intent ("Mình chưa hiểu", "khó quá", "giúp mình với", "giải thích lại", "hướng dẫn bước này")
  if (
    explicitIntentTag === 'need_help' ||
    text.includes('chưa hiểu') ||
    text.includes('không hiểu') ||
    text.includes('khó quá') ||
    text.includes('làm sao') ||
    text.includes('giúp con') ||
    text.includes('giúp mình') ||
    text.includes('chỉ lại') ||
    text.includes('hướng dẫn lại') ||
    text.includes('bước hiện tại')
  ) {
    const matchedTaskId = matchTaskByKeywords() || 'task-backpack';
    const task =
      data.tasks.find((t) => t.id === matchedTaskId) || data.tasks[0];
    return {
      intent: 'need_help',
      autoNavigate: false,
      targetSubView: { type: 'guide-task', taskId: task.id },
      actionLabel: `Xem thẻ hình hướng dẫn: ${task.title}`,
      taskId: task.id,
      helpTopicTaskId: task.id,
      suggestedReply: `${childName} đừng lo nhé! Mình cùng xem từng bức hình nhỏ và thử làm từ từ từng bước một thôi. Bạn nhìn Thẻ Trợ Giúp bằng hình ảnh ngay bên dưới hoặc bấm mở hướng dẫn "${task.title}" cùng mình nhé!`,
    };
  }

  // 3. Check GROWTH JOURNEY intent ("Hành trình", "lòng biết ơn", "trung thực", "dũng cảm", "sẻ chia", "tử tế", "kiên trì", "tự lập", "trách nhiệm")
  if (
    explicitIntentTag === 'open_journey' ||
    text.includes('hành trình') ||
    text.includes('biết ơn') ||
    text.includes('trung thực') ||
    text.includes('dũng cảm') ||
    text.includes('sẻ chia') ||
    text.includes('trách nhiệm') ||
    text.includes('kiên trì') ||
    text.includes('tử tế') ||
    text.includes('tự lập') ||
    text.includes('phẩm chất')
  ) {
    const approvedTopics = (data.growthTopics || []).filter(
      (t) => t.approvalStatus === 'approved' && t.selectedByParent
    );
    const matchedTopic =
      approvedTopics.find((t) => text.includes(t.title.toLowerCase())) ||
      approvedTopics.find((t) => t.isCurrentFocus) ||
      approvedTopics[0];

    return {
      intent: 'open_journey',
      autoNavigate: true,
      targetTab: 'journey',
      topicId: matchedTopic?.id,
      actionLabel: matchedTopic
        ? `Khám phá: ${matchedTopic.title}`
        : 'Mở bản đồ Hành trình',
      suggestedReply: matchedTopic
        ? `Tuyệt quá ${childName}! Mình cùng mở bản đồ Hành trình để khám phá chủ đề "${matchedTopic.title}" nhé!`
        : `Mình cùng mở bản đồ Hành trình để khám phá những điều tốt đẹp mỗi ngày nhé ${childName}!`,
    };
  }

  // 4. Check START TASK intent ("Buddy ơi, mình muốn chuẩn bị cặp sách", "hướng dẫn...")
  const specificTaskId = matchTaskByKeywords();
  if (
    specificTaskId ||
    explicitIntentTag === 'guide_task' ||
    explicitIntentTag === 'start_task' ||
    text.includes('muốn chuẩn bị') ||
    text.includes('bắt đầu nhiệm vụ') ||
    text.includes('làm nhiệm vụ') ||
    text.includes('nhờ hướng dẫn')
  ) {
    const targetId = specificTaskId || 'task-backpack';
    const task =
      data.tasks.find((t) => t.id === targetId) || data.tasks[0];
    return {
      intent: 'start_task',
      autoNavigate: true,
      targetSubView: { type: 'guide-task', taskId: task.id },
      actionLabel: `Mở hướng dẫn: ${task.title}`,
      taskId: task.id,
      suggestedReply: `Tuyệt quá ${childName} ơi! Mình cùng mở ngay thẻ hình hướng dẫn "${task.title}" từng bước một nhé. Bạn thử xem bức hình đầu tiên nào!`,
    };
  }

  // 5. Check TELL STORY intent ("Buddy ơi, kể chuyện", "nghe kể chuyện", "truyện tối nay")
  if (
    explicitIntentTag === 'start_storytelling' ||
    explicitIntentTag === 'tell_story' ||
    text.includes('kể chuyện') ||
    text.includes('đọc truyện') ||
    text.includes('nghe chuyện') ||
    text.includes('câu chuyện') ||
    text.includes('tích chu') ||
    text.includes('kiến nhỏ') ||
    text.includes('hạt giống') ||
    text.includes('chim sẻ') ||
    text.includes('bầu trời đêm')
  ) {
    let matchedStory = data.stories[0];
    if (text.includes('kiến')) {
      matchedStory = data.stories.find((s) => s.illustrationType === 'kien-nho') || matchedStory;
    } else if (text.includes('hạt giống') || text.includes('hướng dương')) {
      matchedStory = data.stories.find((s) => s.illustrationType === 'hat-giong') || matchedStory;
    } else if (text.includes('chim sẻ')) {
      matchedStory = data.stories.find((s) => s.illustrationType === 'chim-se') || matchedStory;
    } else if (text.includes('bầu trời') || text.includes('ngôi sao')) {
      matchedStory = data.stories.find((s) => s.illustrationType === 'bau-troi-dem') || matchedStory;
    }

    const wantsSpecificStory =
      text.includes('tích chu') ||
      text.includes('kiến') ||
      text.includes('hạt giống') ||
      text.includes('chim sẻ') ||
      text.includes('bầu trời');

    return {
      intent: 'tell_story',
      autoNavigate: true,
      targetSubView: wantsSpecificStory
        ? { type: 'story-detail', storyId: matchedStory.id }
        : { type: 'story-list' },
      actionLabel: wantsSpecificStory
        ? `Nghe truyện: ${matchedStory.title}`
        : 'Mở Kho truyện mỗi tối',
      storyId: matchedStory.id,
      suggestedReply: wantsSpecificStory
        ? `${childName} ơi, mình cùng lắng nghe câu chuyện "${matchedStory.title}" thật ấm áp ngay bây giờ nhé!`
        : `Được luôn ${childName} ơi! Mình cùng ghé Kho truyện mỗi tối ngay đây. Bạn thích nghe truyện nào cứ chạm vào tranh nhé!`,
    };
  }

  // 6. Check TODAY ACTIVITIES intent ("Bắt đầu việc hôm nay", "hôm nay làm gì", "hoạt động hôm nay")
  if (
    explicitIntentTag === 'view_routine' ||
    explicitIntentTag === 'today_activities' ||
    text.includes('việc hôm nay') ||
    text.includes('hoạt động hôm nay') ||
    text.includes('lịch trình') ||
    text.includes('hôm nay con làm gì') ||
    text.includes('hôm nay mình làm gì')
  ) {
    return {
      intent: 'today_activities',
      autoNavigate: true,
      targetTab: 'activities',
      actionLabel: 'Mở Hoạt động hôm nay',
      suggestedReply: `Hôm nay có nhiều hoạt động thú vị đang chờ ${childName} đó! Mình mở ngay màn hình Hoạt động để bạn chọn thẻ hình bắt đầu nhé!`,
    };
  }

  // 7. Check VIEW STARS / REWARDS intent ("Xem sao", "ngôi sao", "quà tặng", "vòng quay")
  if (
    explicitIntentTag === 'view_stars_rewards' ||
    text.includes('xem sao') ||
    text.includes('ngôi sao') ||
    text.includes('mấy sao') ||
    text.includes('bao nhiêu sao') ||
    text.includes('phần thưởng') ||
    text.includes('vòng quay') ||
    text.includes('quà của con') ||
    text.includes('quà của mình')
  ) {
    const wantsWheel = text.includes('vòng quay') || text.includes('quà');
    return {
      intent: 'view_stars_rewards',
      autoNavigate: true,
      targetSubView: wantsWheel
        ? { type: 'rewards-wheel' }
        : { type: 'stars-detail' },
      actionLabel: wantsWheel ? 'Mở Vòng quay Quà tặng' : `Xem Ngôi sao của ${childName}`,
      suggestedReply: wantsWheel
        ? `Mình cùng mở Vòng quay Quà để xem các phần thưởng gia đình tháng này nhé ${childName}!`
        : `Mình đưa ${childName} sang xem Bầu trời Ngôi sao nỗ lực của bạn ngay đây!`,
    };
  }

  // 8. Default: GREETING OR CURIOUS CHAT
  return {
    intent: 'greeting_or_chat',
    autoNavigate: false,
    actionLabel: 'Khám phá cùng Buddy',
    suggestedReply: `Chào ${childName}! Mình luôn sẵn sàng lắng nghe bạn. Bạn có thể hỏi mình điều thú vị, rủ mình cùng chuẩn bị cặp sách, mở bản đồ Hành trình, hoặc nghe kể chuyện mỗi tối nhé!`,
  };
}
