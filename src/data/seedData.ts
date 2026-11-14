import { BuddyAppData } from '../types/domain';
import { DEFAULT_POINTS_POLICY, getCurrentMonthKey, getTodayDateKey } from '../services/pointsPolicy';

/**
 * Monotonic version for built-in system seed content (tasks, steps, schedule, stories, growth journey).
 * Incrementing this value triggers selective synchronization of system-managed fields
 * for unmodified built-in entities without overwriting parent-created or parent-customized items.
 */
export const SEED_CONTENT_VERSION = 2026111402;

export function createInitialSeedData(): BuddyAppData {
  const todayKey = getTodayDateKey();
  const monthKey = getCurrentMonthKey();

  return {
    seedContentVersion: SEED_CONTENT_VERSION,
    deletedBuiltinTaskIds: [],
    profile: {
      id: 'child-minh-anh',
      displayName: 'Minh Anh',
      nickname: 'Minh Anh',
      ageGroup: '6-8',
      ageYears: 8,
      avatarColor: '#EAF3FF',
      currentCycleMonth: monthKey,
      isDemoProfile: true,
      parentConsentGranted: false,
      characterVariant: 'girl',
    },
    voicePreference: {
      gender: 'female',
      volume: 0.9,
      muted: false,
      speechRate: 0.95,
      preferServerTts: true,
      updatedAt: new Date().toISOString(),
    },
    pointsPolicy: { ...DEFAULT_POINTS_POLICY },
    tasks: [
      {
        id: 'task-backpack',
        slug: 'chuan-bi-cap-sach',
        title: 'Chuẩn bị cặp sách',
        subtitle: 'Sắp xếp sách vở và hộp bút gọn gàng cho ngày học mới',
        category: 'preparation',
        iconName: 'Backpack',
        themeColor: 'ice',
        coverIllustration: 'pack-books',
        estimatedMinutes: 5,
        starReward: 2,
        approvalStatus: 'approved',
        lastApprovedAt: '2026-11-01T08:00:00.000Z',
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: [
          {
            id: 'step-bp-1',
            stepNumber: 1,
            actionTitle: 'Xem thời khóa biểu ngày mai',
            instruction: 'Mở thời khóa biểu trên bàn học để xem ngày mai có những môn gì.',
            buddySpeech:
              'Bạn ơi! Ngày mai chúng mình sẽ học những môn gì nhỉ? Bạn mở thời khóa biểu trên bàn học ra, mình cùng xem nhé!',
            simpleExplanation:
              'Thời khóa biểu ghi tên các môn học từng ngày. Mình chỉ cần dò cột của ngày mai từ trên xuống dưới là biết ngay cần chuẩn bị môn nào đó bạn!',
            buddyPraise: 'Tuyệt lắm! Xem thời khóa biểu trước giúp chúng mình không bao giờ quên sách vở.',
            illustrationKey: 'schedule-check',
          },
          {
            id: 'step-bp-2',
            stepNumber: 2,
            actionTitle: 'Lấy sách và vở theo môn học',
            instruction: 'Tìm sách giáo khoa và vở bài tập của các môn ngày mai đặt lên bàn.',
            buddySpeech:
              'Mình biết các môn học của ngày mai rồi! Bạn tìm sách và vở tương ứng trên kệ, rồi đặt chúng lên bàn cùng mình nhé!',
            simpleExplanation:
              'Mỗi môn học trong thời khóa biểu thường có một quyển sách đọc và một quyển vở viết đi cùng nhau. Bạn lấy từng cặp đặt lên mặt bàn nhé!',
            buddyPraise: 'Tuyệt vời! Bạn đã tập hợp đủ sách và vở cho các môn ngày mai rồi!',
            illustrationKey: 'take-books',
          },
          {
            id: 'step-bp-3',
            stepNumber: 3,
            actionTitle: 'Xếp sách vào cặp ngay ngắn',
            instruction: 'Đặt sách to ở phía sau sát lưng cặp, vở nhỏ ở phía trước.',
            buddySpeech:
              'Đến lúc đưa các bạn sách về ngôi nhà balo rồi! Bạn đặt sách to phía sau sát lưng cặp, vở nhỏ phía trước nhé. Mình cùng thử nào!',
            simpleExplanation:
              'Xếp quyển to đứng sau, quyển nhỏ đứng trước trong ngăn chính giúp balo đứng thẳng và không bị quăn góc vở đó bạn.',
            buddyPraise: 'Khéo tay quá! Các bạn sách vở nằm ngay ngắn trong balo rồi kìa.',
            illustrationKey: 'pack-books',
          },
          {
            id: 'step-bp-4',
            stepNumber: 4,
            actionTitle: 'Kiểm tra hộp bút đầy đủ',
            instruction: 'Mở hộp bút kiểm tra bút chì, thước kẻ, tẩy rồi đặt vào ngăn phụ.',
            buddySpeech:
              'Các bạn bút chì và cục tẩy đã sẵn sàng đi học chưa nhỉ? Bạn mở hộp bút kiểm tra bút, thước kẻ và tẩy, rồi cất hộp bút vào ngăn nhỏ nhé!',
            simpleExplanation:
              'Mình đếm xem trong hộp đã có ít nhất hai cây bút, một cục tẩy và một cây thước kẻ chưa. Đủ rồi thì mình đóng nắp hộp bút lại nhé!',
            buddyPraise: 'Chuẩn bị hộp bút kỹ càng như vậy, ngày mai vào lớp viết bài sẽ thật yên tâm!',
            illustrationKey: 'pencil-case',
          },
          {
            id: 'step-bp-5',
            stepNumber: 5,
            actionTitle: 'Đặt cặp ở vị trí phù hợp',
            instruction: 'Để bình nước vào túi hông, kéo khóa cặp và đặt ngay ngắn cạnh bàn học.',
            buddySpeech:
              'Chỉ còn bước cuối cùng thôi nè! Bạn cài bình nước vào túi bên hông, kéo khóa balo thật gọn rồi đặt cặp ngay cạnh bàn học cho sáng mai nhé!',
            simpleExplanation:
              'Đặt cặp cố định cạnh bàn học giúp sáng mai thức dậy bạn nhìn thấy ngay mà không phải tìm kiếm vội vàng.',
            buddyPraise: 'Chúng mình làm được rồi! Cặp sách của bạn đã sẵn sàng cho ngày mai!',
            illustrationKey: 'water-bottle',
          },
        ],
      },
      {
        id: 'task-study-desk',
        slug: 'don-goc-hoc-tap',
        title: 'Dọn góc học tập',
        subtitle: 'Giữ mặt bàn sạch thoáng để học bài thật tập trung',
        category: 'tidy',
        iconName: 'BookOpenCheck',
        themeColor: 'mint',
        coverIllustration: 'tidy-desk',
        estimatedMinutes: 5,
        starReward: 2,
        approvalStatus: 'approved',
        lastApprovedAt: '2026-11-01T08:00:00.000Z',
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: [
          {
            id: 'step-sd-1',
            stepNumber: 1,
            actionTitle: 'Gom bút vào ống đựng',
            instruction: 'Nhặt bút chì, bút màu trên mặt bàn và cắm gọn vào ống bút.',
            buddySpeech:
              'Ơ kìa, mấy bạn bút chì và bút màu đang nằm nghỉ rải rác trên bàn! Bạn gom các cây bút lại và cắm gọn vào chiếc ống đựng ở góc bàn cùng mình nhé!',
            simpleExplanation:
              'Mỗi cây bút đều có ngôi nhà là chiếc ống đựng bút. Bạn gom hết bút trên bàn rồi cắm đầu bút hướng lên trên là gọn ngay!',
            buddyPraise: 'Chiếc ống bút trông gọn gàng và đẹp mắt quá!',
            illustrationKey: 'pen-holder',
          },
          {
            id: 'step-sd-2',
            stepNumber: 2,
            actionTitle: 'Xếp sách truyện lên kệ',
            instruction: 'Gom các quyển sách, truyện đã đọc xong và xếp thẳng hàng lên giá sách.',
            buddySpeech:
              'Mặt bàn vơi bớt đồ rồi đó! Bây giờ bạn gom những quyển sách và truyện đã đọc xong, dựng thẳng hàng lên giá sách nhé. Mình cùng xếp nào!',
            simpleExplanation:
              'Mình xếp quyển cao ở trong, quyển thấp ở ngoài và xoay gáy sách ra ngoài để lần sau muốn đọc quyển nào là tìm thấy ngay nhé!',
            buddyPraise: 'Giá sách thẳng tắp luôn, mình khen bạn rất khéo tay!',
            illustrationKey: 'sort-books',
          },
          {
            id: 'step-sd-3',
            stepNumber: 3,
            actionTitle: 'Bỏ giấy vụn và lau mặt bàn',
            instruction: 'Bỏ giấy nháp cũ vào sọt rác và dùng khăn mềm lau sạch mặt bàn.',
            buddySpeech:
              'Giờ mình làm cho mặt bàn sáng bóng lên nhé! Bạn nhặt những mẩu giấy vụn bỏ vào sọt rác, rồi lấy khăn mềm lau nhẹ khắp mặt bàn nào!',
            simpleExplanation:
              'Bạn chỉ cần lau nhẹ tay từ bên trái sang bên phải mặt bàn là bụi bẩn và vụn tẩy sẽ biến mất hết ngay.',
            buddyPraise: 'Góc học tập của bạn sạch bong và thoáng đãng, nhìn thật thích mắt!',
            illustrationKey: 'wipe-table',
          },
        ],
      },
      {
        id: 'task-toys',
        slug: 'don-do-choi',
        title: 'Dọn đồ chơi',
        subtitle: 'Đưa các bạn đồ chơi về đúng giỏ sau giờ vui chơi',
        category: 'tidy',
        iconName: 'Blocks',
        themeColor: 'yellow',
        coverIllustration: 'toy-box',
        estimatedMinutes: 6,
        starReward: 2,
        approvalStatus: 'approved',
        lastApprovedAt: '2026-11-01T08:00:00.000Z',
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: [
          {
            id: 'step-ty-1',
            stepNumber: 1,
            actionTitle: 'Cất các khối xếp hình vào hộp',
            instruction: 'Nhặt những mảnh ghép và khối gỗ trên sàn cho vào hộp nhựa.',
            buddySpeech:
              'Giờ chơi vui quá, mình cùng chơi trò thu gom kho báu xếp hình nhé! Bạn nhặt các khối gỗ và mảnh ghép trên sàn bỏ vào hộp nhựa để không ai dẫm phải nào!',
            simpleExplanation:
              'Những mảnh ghép nhỏ rất dễ bị thất lạc trên sàn, nên mình gom hết chúng vào chiếc hộp có nắp đậy trước tiên nhé!',
            buddyPraise: 'Sàn nhà thoáng hẳn ra rồi, bạn làm nhanh tay quá!',
            illustrationKey: 'building-blocks',
          },
          {
            id: 'step-ty-2',
            stepNumber: 2,
            actionTitle: 'Đặt thú bông lên kệ hoặc góc giường',
            instruction: 'Ôm các bạn gấu bông, búp bê đặt ngồi ngay ngắn trên kệ đồ chơi.',
            buddySpeech:
              'Các bạn gấu bông cũng muốn được nghỉ ngơi sau giờ chơi đó! Bạn ôm từng bạn thú bông đặt ngồi ngay ngắn lên kệ hoặc góc giường cùng mình nhé!',
            simpleExplanation:
              'Mình đặt các bạn thú bông lớn tựa lưng vào kệ phía trong, các bạn nhỏ ngồi phía trước để bạn nào cũng có chỗ ngồi thật êm nha!',
            buddyPraise: 'Các bạn thú bông đang mỉm cười cảm ơn bạn kìa!',
            illustrationKey: 'plush-friends',
          },
          {
            id: 'step-ty-3',
            stepNumber: 3,
            actionTitle: 'Đặt giỏ đồ chơi về góc phòng',
            instruction: 'Đẩy nhẹ giỏ đồ chơi sát vào góc tường cho lối đi rộng rãi.',
            buddySpeech:
              'Chỉ còn một việc nhỏ xíu nữa thôi! Bạn đậy nắp hộp và đẩy nhẹ giỏ đồ chơi sát vào góc phòng để lối đi thật rộng rãi nhé!',
            simpleExplanation:
              'Khi giỏ đồ chơi nằm gọn ở góc phòng, cả nhà mình đi lại sẽ rất thoải mái và an toàn.',
            buddyPraise: 'Căn phòng gọn gàng tinh tươm rồi, bạn giữ gìn đồ chơi khéo lắm!',
            illustrationKey: 'toy-box',
          },
        ],
      },
      {
        id: 'task-wash-hands',
        slug: 'rua-tay-sach-khoe',
        title: 'Rửa tay',
        subtitle: 'Rửa tay sạch bọt xà phòng để bảo vệ sức khỏe mỗi ngày',
        category: 'hygiene',
        iconName: 'Sparkles',
        themeColor: 'peach',
        coverIllustration: 'wash-hands',
        estimatedMinutes: 3,
        starReward: 2,
        approvalStatus: 'approved',
        lastApprovedAt: '2026-11-01T08:00:00.000Z',
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: [
          {
            id: 'step-wh-1',
            stepNumber: 1,
            actionTitle: 'Làm ướt tay và lấy xà phòng',
            instruction: 'Mở vòi nước vừa phải, làm ướt hai bàn tay và nhấn lấy xà phòng.',
            buddySpeech:
              'Mình cùng tạo những đám mây bọt xà phòng thơm mát nhé! Bạn mở vòi nước làm ướt hai bàn tay, rồi nhấn lấy một giọt xà phòng vào lòng bàn tay nào!',
            simpleExplanation:
              'Bạn mở vòi nước nhỏ vừa phải để nước không bắn ra áo, rồi lấy một giọt xà phòng là đủ tạo thật nhiều bọt mịn rồi!',
            buddyPraise: 'Bọt xà phòng thơm mát đã sẵn sàng trên tay bạn rồi!',
            illustrationKey: 'soap-bubbles',
          },
          {
            id: 'step-wh-2',
            stepNumber: 2,
            actionTitle: 'Chà kỹ lòng bàn tay và kẽ ngón tay',
            instruction: 'Xoa đều lòng bàn tay, mu bàn tay và đan các ngón tay tạo bọt mịn.',
            buddySpeech:
              'Bây giờ bạn xoa đều hai lòng bàn tay, mu bàn tay và đan các kẽ ngón tay vào nhau nhé! Mình cùng xoa bọt thật kỹ để đuổi hết bụi bẩn đi nào!',
            simpleExplanation:
              'Bạn có thể vừa xoa bọt xà phòng khắp các ngón tay vừa đếm nhẩm chậm rãi từ một đến mười lăm cùng mình nhé!',
            buddyPraise: 'Bạn chà tay kỹ lắm, vi khuẩn bẩn chạy trốn hết rồi!',
            illustrationKey: 'wash-hands',
          },
          {
            id: 'step-wh-3',
            stepNumber: 3,
            actionTitle: 'Xả sạch nước và lau khô bằng khăn',
            instruction: 'Xả sạch bọt dưới vòi nước, khóa vòi cẩn thận rồi lau khô tay vào khăn.',
            buddySpeech:
              'Đến lúc rửa trôi những đám mây bọt dưới làn nước mát rồi! Rửa sạch xong bạn nhớ khóa vòi nước và thấm khô hai bàn tay bằng khăn bông mềm nhé!',
            simpleExplanation:
              'Nhớ khóa vòi nước để tiết kiệm nước sạch và lau khô cả lòng bàn tay lẫn mu bàn tay để không bị ướt áo nhé.',
            buddyPraise: 'Đôi bàn tay của bạn vừa thơm vừa sạch tinh tươm!',
            illustrationKey: 'clean-towel',
          },
        ],
      },
      {
        id: 'task-tomorrow-prep',
        slug: 'chuan-bi-do-dung-ngay-mai',
        title: 'Chuẩn bị đồ dùng ngày mai',
        subtitle: 'Soạn sẵn quần áo và mũ nón để buổi sáng thức dậy thật thảnh thơi',
        category: 'preparation',
        iconName: 'SunMedium',
        themeColor: 'lavender',
        coverIllustration: 'clothes-ready',
        estimatedMinutes: 4,
        starReward: 2,
        approvalStatus: 'approved',
        lastApprovedAt: '2026-11-01T08:00:00.000Z',
        sourceType: 'builtin',
        contentVersion: SEED_CONTENT_VERSION,
        customizedByParent: false,
        steps: [
          {
            id: 'step-tp-1',
            stepNumber: 1,
            actionTitle: 'Chọn bộ quần áo đi học ngày mai',
            instruction: 'Lấy sẵn bộ đồng phục hoặc quần áo mặc ngày mai đặt ở nơi dễ lấy.',
            buddySpeech:
              'Tối nay mình chuẩn bị trước để sáng mai thức dậy thật thảnh thơi nhé! Bạn mở tủ lấy bộ đồng phục hoặc quần áo mặc ngày mai, rồi treo ở nơi dễ lấy nào!',
            simpleExplanation:
              'Bạn lấy đủ cả áo và quần cho ngày mai, vuốt phẳng phiu rồi treo lên móc hoặc xếp ngay ngắn ở góc giường nhé!',
            buddyPraise: 'Bộ quần áo ngày mai đã được xếp thật phẳng phiu!',
            illustrationKey: 'clothes-ready',
          },
          {
            id: 'step-tp-2',
            stepNumber: 2,
            actionTitle: 'Chuẩn bị tất, giày và mũ đội đầu',
            instruction: 'Lấy một đôi tất sạch đặt cạnh giày và để sẵn mũ ở kệ gần cửa.',
            buddySpeech:
              'Tiếp theo mình chuẩn bị cho đôi chân nhỏ nhé! Bạn lấy một đôi tất sạch đặt ngay cạnh đôi giày đi học, và để sẵn mũ lên kệ gần cửa ra vào nào!',
            simpleExplanation:
              'Để sẵn đôi tất cùng với giày giúp sáng mai bạn mang giày nhanh ơi là nhanh mà không lo tìm thiếu một chiếc tất.',
            buddyPraise: 'Chu đáo quá! Mọi món đồ nhỏ đều đã vào đúng vị trí.',
            illustrationKey: 'shoes-hat',
          },
          {
            id: 'step-tp-3',
            stepNumber: 3,
            actionTitle: 'Điểm danh đồ dùng lần cuối cùng Buddy',
            instruction: 'Nhìn kiểm tra lại cặp sách, bình nước và bộ quần áo ngày mai.',
            buddySpeech:
              'Bây giờ hai đứa mình cùng điểm danh lần cuối nhé! Bạn nhìn xem cặp sách, bình nước và bộ quần áo ngày mai đã có mặt đủ cả ba chưa nào?',
            simpleExplanation:
              'Một là cặp sách, hai là bình nước, ba là quần áo ngày mai. Đủ cả ba món là bạn đã sẵn sàng cho ngày mới rồi!',
            buddyPraise: 'Chúng mình làm xong rồi! Sáng mai bạn sẽ có một khởi đầu thật nhẹ nhàng và vui vẻ!',
            illustrationKey: 'check-list',
          },
        ],
      },
    ],
    routines: [
      {
        id: 'routine-morning-wash',
        title: 'Rửa tay & vệ sinh cá nhân buổi sáng',
        period: 'morning',
        dueTime: '06:45',
        linkedTaskId: 'task-wash-hands',
        reminderEnabled: true,
        approvedByParent: true,
        completedDates: [`${monthKey}-01`, `${monthKey}-02`, `${monthKey}-03`, todayKey],
      },
      {
        id: 'routine-afterschool-toys',
        title: 'Dọn đồ chơi gọn gàng sau giờ chơi',
        period: 'after_school',
        dueTime: '17:15',
        linkedTaskId: 'task-toys',
        reminderEnabled: true,
        approvedByParent: true,
        completedDates: [`${monthKey}-01`, `${monthKey}-03`],
      },
      {
        id: 'routine-afterschool-desk',
        title: 'Dọn góc học tập sạch thoáng',
        period: 'after_school',
        dueTime: '18:00',
        linkedTaskId: 'task-study-desk',
        reminderEnabled: true,
        approvedByParent: true,
        completedDates: [`${monthKey}-02`],
      },
      {
        id: 'routine-evening-backpack',
        title: 'Chuẩn bị cặp sách cho ngày mai',
        period: 'evening',
        dueTime: '19:45',
        linkedTaskId: 'task-backpack',
        reminderEnabled: true,
        approvedByParent: true,
        completedDates: [`${monthKey}-01`, `${monthKey}-02`, `${monthKey}-03`],
      },
      {
        id: 'routine-evening-clothes',
        title: 'Chuẩn bị đồ dùng ngày mai',
        period: 'evening',
        dueTime: '20:15',
        linkedTaskId: 'task-tomorrow-prep',
        reminderEnabled: true,
        approvedByParent: true,
        completedDates: [`${monthKey}-03`],
      },
    ],
    schoolSchedule: {
      cycleType: 'weekly',
      effectiveFrom: `${monthKey}-01`,
      effectiveTo: `${monthKey}-30`,
      prepReminderTime: '19:45',
      reminderEnabled: true,
      updatedAt: new Date().toISOString(),
      contentVersion: SEED_CONTENT_VERSION,
      customizedByParent: false,
      weeklyDays: [
        {
          dayOfWeek: 1,
          dayLabel: 'Thứ Hai',
          subjects: ['Chào cờ', 'Tiếng Việt', 'Toán', 'Đạo đức'],
          supplies: ['Sách Tiếng Việt', 'Sách Toán', 'Vở ô ly', 'Khăn quàng / Đồng phục chính khóa'],
          note: 'Đầu tuần bạn nhớ mặc đồng phục chỉnh tề nhé!',
        },
        {
          dayOfWeek: 2,
          dayLabel: 'Thứ Ba',
          subjects: ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Mỹ thuật'],
          supplies: ['Sách Toán & Tiếng Việt', 'Sách Tiếng Anh', 'Giấy vẽ A4', 'Hộp bút sáp màu'],
          note: 'Nhớ mang đủ hộp bút màu cho giờ Mỹ thuật.',
        },
        {
          dayOfWeek: 3,
          dayLabel: 'Thứ Tư',
          subjects: ['Tiếng Việt', 'Toán', 'Tự nhiên & Xã hội', 'Âm nhạc'],
          supplies: ['Sách Tiếng Việt', 'Sách Toán', 'Sách Tự nhiên & Xã hội', 'Thanh phách âm nhạc'],
          note: 'Kiểm tra thước kẻ và bút chì trong hộp bút.',
        },
        {
          dayOfWeek: 4,
          dayLabel: 'Thứ Năm',
          subjects: ['Toán', 'Tiếng Anh', 'Tin học', 'Thể dục'],
          supplies: ['Sách Toán', 'Sách Tiếng Anh', 'Đồng phục Thể dục', 'Giày thể thao & Bình nước'],
          note: 'Thứ Năm có tiết Thể dục, bạn nhớ chuẩn bị giày thể thao nhé!',
        },
        {
          dayOfWeek: 5,
          dayLabel: 'Thứ Sáu',
          subjects: ['Tiếng Việt', 'Toán', 'Hoạt động trải nghiệm', 'Sinh hoạt lớp'],
          supplies: ['Sách Tiếng Việt & Toán', 'Vở bài tập', 'Sổ liên lạc / Phiếu khen'],
          note: 'Cuối tuần mang bình nước và hộp bút về vệ sinh sạch sẽ.',
        },
        {
          dayOfWeek: 6,
          dayLabel: 'Thứ Bảy',
          subjects: ['Câu Lạc Bộ Vẽ sáng tạo', 'Đọc sách thư viện gia đình'],
          supplies: ['Tập vẽ phác thảo', 'Bút chì màu', 'Cuốn truyện yêu thích'],
          note: 'Ngày cuối tuần vui học nhẹ nhàng.',
        },
        {
          dayOfWeek: 0,
          dayLabel: 'Chủ Nhật',
          subjects: ['Dã ngoại gia đình', 'Ôn bài nhẹ nhàng'],
          supplies: ['Mũ rộng vành', 'Bình nước cá nhân'],
          note: 'Tối Chủ Nhật nhớ soạn cặp cho sáng Thứ Hai nhé!',
        },
      ],
      dateOverrides: [],
    },
    taskRuns: [
      {
        id: 'run-seed-1',
        taskId: 'task-backpack',
        routineId: 'routine-evening-backpack',
        dateKey: `${monthKey}-01`,
        startedAt: `${monthKey}-01T19:45:00.000Z`,
        completedStepIds: ['step-bp-1', 'step-bp-2', 'step-bp-3', 'step-bp-4', 'step-bp-5'],
        helpRequestedStepIds: [],
        status: 'completed',
        completedAt: `${monthKey}-01T19:50:00.000Z`,
        starsAwarded: 2,
      },
      {
        id: 'run-seed-2',
        taskId: 'task-study-desk',
        routineId: 'routine-afterschool-desk',
        dateKey: `${monthKey}-02`,
        startedAt: `${monthKey}-02T18:02:00.000Z`,
        completedStepIds: ['step-sd-1', 'step-sd-2', 'step-sd-3'],
        helpRequestedStepIds: [],
        status: 'completed',
        completedAt: `${monthKey}-02T18:10:00.000Z`,
        starsAwarded: 2,
      },
      {
        id: 'run-seed-3',
        taskId: 'task-toys',
        routineId: 'routine-afterschool-toys',
        dateKey: `${monthKey}-03`,
        startedAt: `${monthKey}-03T17:20:00.000Z`,
        completedStepIds: ['step-ty-1', 'step-ty-2', 'step-ty-3'],
        helpRequestedStepIds: [],
        status: 'completed',
        completedAt: `${monthKey}-03T17:30:00.000Z`,
        starsAwarded: 2,
      },
      {
        id: 'run-seed-4',
        taskId: 'task-tomorrow-prep',
        routineId: 'routine-evening-clothes',
        dateKey: `${monthKey}-03`,
        startedAt: `${monthKey}-03T20:14:00.000Z`,
        completedStepIds: ['step-tp-1', 'step-tp-2', 'step-tp-3'],
        helpRequestedStepIds: [],
        status: 'completed',
        completedAt: `${monthKey}-03T20:20:00.000Z`,
        starsAwarded: 2,
      },
      {
        id: 'run-seed-5',
        taskId: 'task-wash-hands',
        routineId: 'routine-morning-wash',
        dateKey: todayKey,
        startedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        completedStepIds: ['step-wh-1', 'step-wh-2', 'step-wh-3'],
        helpRequestedStepIds: [],
        status: 'completed',
        completedAt: new Date(Date.now() - 3300 * 1000).toISOString(),
        starsAwarded: 2,
      },
    ],
    starLedger: [
      {
        id: 'star-seed-1',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-01`,
        monthKey,
        amount: 2,
        sourceType: 'task_completion',
        sourceId: 'task-backpack',
        idempotencyKey: `task_completion:task-backpack:${monthKey}-01`,
        title: 'Hoàn thành Chuẩn bị cặp sách',
        note: 'Mình tự xếp sách vở theo thời khóa biểu',
        createdAt: `${monthKey}-01T19:50:00.000Z`,
      },
      {
        id: 'star-seed-2',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-02`,
        monthKey,
        amount: 2,
        sourceType: 'task_completion',
        sourceId: 'task-study-desk',
        idempotencyKey: `task_completion:task-study-desk:${monthKey}-02`,
        title: 'Hoàn thành Dọn góc học tập',
        note: 'Mặt bàn sạch đẹp, ống bút gọn gàng',
        createdAt: `${monthKey}-02T18:10:00.000Z`,
      },
      {
        id: 'star-seed-3',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-02`,
        monthKey,
        amount: 2,
        sourceType: 'parent_encouragement',
        sourceId: 'parent-praise-1',
        idempotencyKey: `parent_encouragement:parent-praise-1:${monthKey}-02`,
        title: 'Ba mẹ khen bạn lễ phép & biết giúp đỡ',
        note: 'Tự giác lấy nước mời ông bà',
        createdAt: `${monthKey}-02T20:00:00.000Z`,
      },
      {
        id: 'star-seed-4',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-03`,
        monthKey,
        amount: 2,
        sourceType: 'task_completion',
        sourceId: 'task-toys',
        idempotencyKey: `task_completion:task-toys:${monthKey}-03`,
        title: 'Hoàn thành Dọn đồ chơi',
        note: 'Cất gọn khối xếp hình và thú bông',
        createdAt: `${monthKey}-03T17:30:00.000Z`,
      },
      {
        id: 'star-seed-5',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-03`,
        monthKey,
        amount: 2,
        sourceType: 'task_completion',
        sourceId: 'task-tomorrow-prep',
        idempotencyKey: `task_completion:task-tomorrow-prep:${monthKey}-03`,
        title: 'Hoàn thành Chuẩn bị đồ dùng ngày mai',
        note: 'Soạn sẵn quần áo đi học từ tối',
        createdAt: `${monthKey}-03T20:20:00.000Z`,
      },
      {
        id: 'star-seed-6',
        childId: 'child-minh-anh',
        dateKey: `${monthKey}-03`,
        monthKey,
        amount: 2,
        sourceType: 'story_reflection',
        sourceId: 'story-tich-chu',
        idempotencyKey: `story_reflection:story-tich-chu:${monthKey}-03`,
        title: 'Chia sẻ suy ngẫm sau giờ kể chuyện',
        note: 'Nghe truyện Cậu bé Tích Chu và trò chuyện cùng Buddy',
        createdAt: `${monthKey}-03T20:45:00.000Z`,
      },
      {
        id: 'star-seed-7',
        childId: 'child-minh-anh',
        dateKey: todayKey,
        monthKey,
        amount: 2,
        sourceType: 'task_completion',
        sourceId: 'task-wash-hands',
        idempotencyKey: `task_completion:task-wash-hands:${todayKey}`,
        title: 'Hoàn thành Rửa tay buổi sáng',
        note: 'Rửa tay đủ 3 bước sạch khỏe',
        createdAt: new Date().toISOString(),
      },
    ],
    rewards: [
      {
        id: 'reward-park',
        title: 'Đi công viên cuối tuần cùng ba mẹ',
        description: 'Cả nhà cùng đạp xe, dạo mát và chơi trò vận động ngoài trời ở công viên.',
        iconName: 'Trees',
        colorTheme: 'mint',
        approvedByParent: true,
        active: true,
      },
      {
        id: 'reward-book',
        title: 'Chọn & đọc 1 cuốn truyện tranh mới cùng mẹ',
        description: 'Bạn được chọn một cuốn sách thiếu nhi yêu thích và đọc cùng ba mẹ tối cuối tuần.',
        iconName: 'BookHeart',
        colorTheme: 'ice',
        approvedByParent: true,
        active: true,
      },
      {
        id: 'reward-baking',
        title: 'Làm bánh quy thơm lừng cùng gia đình',
        description: 'Cùng vào bếp nhào bột, tạo hình ngôi sao và nướng bánh quy bơ sữa.',
        iconName: 'Cookie',
        colorTheme: 'yellow',
        approvedByParent: true,
        active: true,
      },
      {
        id: 'reward-boardgame',
        title: 'Đêm hội Board-game cả nhà',
        description: 'Tối thứ Bảy cả nhà cùng chơi cờ cá ngựa, Uno hoặc ghép hình lớn.',
        iconName: 'Gamepad2',
        colorTheme: 'lavender',
        approvedByParent: true,
        active: true,
      },
      {
        id: 'reward-picnic',
        title: 'Bữa sáng dã ngoại đặc biệt',
        description: 'Chuẩn bị trái cây, bánh mì kẹp và thưởng thức bữa sáng cuối tuần ngoài sân.',
        iconName: 'Sun',
        colorTheme: 'peach',
        approvedByParent: true,
        active: true,
      },
      {
        id: 'reward-craft',
        title: 'Góc thủ công làm lồng đèn giấy',
        description: 'Cả nhà mình cùng cắt dán và trang trí đồ thủ công nhiều màu sắc.',
        iconName: 'Palette',
        colorTheme: 'ice',
        approvedByParent: true,
        active: true,
      },
    ],
    rewardSpins: [],
    stories: [
      {
        id: 'story-tich-chu',
        title: 'Cậu bé Tích Chu và dòng suối mát lành',
        category: 'Truyện dân gian Việt Nam',
        summary: 'Câu chuyện dân gian Việt Nam cảm động về lòng biết ơn và tình yêu thương dành cho người bà tần tảo.',
        durationMinutes: 4,
        ageRecommendation: '6–10 tuổi',
        coverTheme: 'lavender',
        illustrationType: 'tich-chu',
        approvedByParent: true,
        askQuestionAfterStory: true,
        sourceType: 'builtin',
        paragraphs: [
          'Ngày xưa, ở một ngôi làng nhỏ yên bình có cậu bé tên là Tích Chu sống cùng với bà nội. Bà thương Tích Chu hết mực, có thức gì ngon bà cũng dành cho cháu, đêm hè oi ả bà thức quạt cho Tích Chu ngủ ngon giấc.',
          'Thế nhưng lúc ấy Tích Chu còn mải rong chơi cùng bạn bè nên ít khi để ý chăm sóc bà. Một hôm, trời nắng gắt, bà làm việc vất vả nên bị ốm và khát nước khô cả cổ. Bà gọi lớn: "Tích Chu ơi, cho bà ngụm nước mát với!", nhưng gọi mãi vẫn chẳng thấy cháu đâu.',
          'Khi Tích Chu mải chơi chạy về nhà, cậu ngỡ ngàng thấy bà đã hóa thành một chú chim nhỏ vỗ cánh bay lên bầu trời đi tìm nguồn nước mát. Tích Chu ân hận vô cùng, vừa chạy theo vừa gọi bà tha thiết.',
          'Nhờ lời chỉ dẫn của bà Tiên hiền hậu, Tích Chu không ngại đường xa trèo đèo lội suối, vượt qua bao dốc đá để lấy được bình nước suối Tiên trong vắt mang về cho chim uống.',
          'Uống dòng nước thấm đẫm lòng hiếu thảo của cháu, chú chim bỗng hóa lại thành người bà hiền từ. Từ hôm đó, Tích Chu luôn biết yêu thương, lễ phép và tự giác giúp đỡ bà mỗi ngày.',
        ],
        moralLesson: 'Tình yêu thương của ông bà, cha mẹ là món quà quý giá nhất. Chúng mình hãy luôn quan tâm và giúp đỡ người thân từ những việc nhỏ mỗi ngày.',
        reflectionQuestion: 'Theo bạn, ngày mai mình có thể làm một việc nhỏ gì để ba mẹ hoặc ông bà thấy vui lòng nhỉ?',
        reflectionSuggestions: [
          'Rót một cốc nước ấm mời ông bà và ba mẹ',
          'Tự giác chuẩn bị cặp sách không đợi nhắc',
          'Nói lời cảm ơn và chúc ba mẹ ngủ ngon',
        ],
      },
      {
        id: 'story-kien-nho',
        title: 'Chú Kiến Nhỏ và hạt gạo mùa thu',
        category: 'Vượt khó và kiên trì',
        summary: 'Hành trình kiên trì không bỏ cuộc của chú kiến Nâu khi vượt qua con dốc cao để đưa hạt gạo thơm về tổ.',
        durationMinutes: 4,
        ageRecommendation: '6–12 tuổi',
        coverTheme: 'yellow',
        illustrationType: 'kien-nho',
        approvedByParent: true,
        askQuestionAfterStory: true,
        sourceType: 'builtin',
        paragraphs: [
          'Vào một buổi sáng mùa thu nắng vàng rực rỡ, chú kiến Nâu tìm thấy một hạt gạo trắng ngần nằm dưới gốc cây bàng. Hạt gạo to và thơm phức, nhưng đường về tổ lại phải đi qua một con dốc đất khá cao.',
          'Kiến Nâu hít một hơi thật sâu, ghé vai nâng hạt gạo lên rồi bước từng bước nhỏ. Đi được nửa con dốc, hạt gạo trượt xuống làm Kiến Nâu mỏi nhừ cả hai cánh tay.',
          'Bác Bọ Dừa đi ngang qua mỉm cười bảo: "Dốc cao thế kia, cháu thử chia nhỏ chặng đường ra nhé, đi năm bước lại nghỉ lấy sức một nhịp!". Kiến Nâu nghe lời bác, không hề nản lòng mà kiên nhẫn bước từng chặng ngắn.',
          'Cứ năm bước chân đều đặn, Kiến Nâu lại đặt hạt gạo xuống hít thở, rồi tiếp tục tiến lên. Chẳng mấy chốc, chú đã lên tới đỉnh dốc trong tiếng reo hò cổ vũ của cả đàn kiến.',
          'Khi hạt gạo thơm được cất gọn vào kho dự trữ mùa đông, Kiến Nâu hiểu ra rằng: việc lớn đến mấy, chỉ cần chia thành từng bước nhỏ và kiên trì làm tới cùng thì nhất định sẽ thành công.',
        ],
        moralLesson: 'Khi gặp bài học khó hay nhiệm vụ nhiều bước, bạn chỉ cần bình tĩnh thực hiện từng bước một như chú Kiến Nâu nhé.',
        reflectionQuestion: 'Lúc gặp một việc hơi khó, bạn thường làm gì để mình không bị nản lòng nhỉ?',
        reflectionSuggestions: [
          'Chia việc thành từng bước nhỏ giống Buddy hướng dẫn',
          'Hít thở sâu và thử làm lại từ từ',
          'Nhờ ba mẹ hoặc Buddy giải thích chỗ chưa hiểu',
        ],
      },
      {
        id: 'story-hat-giong',
        title: 'Khu vườn của lòng biết ơn',
        category: 'Biết ơn và yêu thương',
        summary: 'Câu chuyện dịu dàng về cô bé An và chậu cây hướng dương biết nở hoa rực rỡ nhờ sự chăm sóc ân cần.',
        durationMinutes: 3,
        ageRecommendation: '6–11 tuổi',
        coverTheme: 'mint',
        illustrationType: 'hat-giong',
        approvedByParent: true,
        askQuestionAfterStory: true,
        sourceType: 'builtin',
        paragraphs: [
          'Sinh nhật lên tám tuổi, bé An được mẹ tặng một gói hạt giống hoa hướng dương nhỏ xíu cùng chiếc chậu đất nung màu nâu ấm áp. An nâng niu gieo hạt xuống lớp đất tơi xốp ngoài ban công.',
          'Mỗi buổi sáng trước khi đi học, An đều dậy sớm tưới cho chậu cây những giọt nước mát lành và thì thầm: "Cảm ơn đất, cảm ơn nắng ấm đã nuôi hạt mầm lớn lên nhé!".',
          'Hai tuần trôi qua, từ mặt đất nâu nhú lên hai chiếc lá mầm xanh biếc, rồi thân cây vươn cao đón ánh mặt trời. Đến cuối tháng, một bông hoa hướng dương vàng tươi như ông mặt trời nhỏ đã nở rộ.',
          'An ngắm bông hoa rực rỡ và ôm chầm lấy mẹ. Cô bé nhận ra rằng cũng giống như mầm cây nhờ nắng và nước mới nở hoa, chính mình mỗi ngày lớn khôn là nhờ biết bao yêu thương, chăm sóc của ba mẹ và thầy cô.',
        ],
        moralLesson: 'Lời cảm ơn chân thành và sự trân trọng những điều bình dị quanh mình sẽ làm mỗi ngày của bạn thêm ấm áp.',
        reflectionQuestion: 'Hôm nay có điều gì vui hoặc ai đó đã giúp bạn mà bạn muốn gửi lời cảm ơn không?',
        reflectionSuggestions: [
          'Cảm ơn mẹ đã nấu bữa cơm ngon',
          'Cảm ơn ba đã dạy mình học điều mới',
          'Cảm ơn bản thân vì hôm nay đã cố gắng',
        ],
      },
      {
        id: 'story-chim-se',
        title: 'Chiếc bút chì màu xanh biển',
        category: 'Trung thực và sẻ chia',
        summary: 'Tình bạn đẹp giữa hai bạn nhỏ lớp Hai khi cùng dũng cảm nhận lỗi và sẻ chia hộp bút màu trong giờ mỹ thuật.',
        durationMinutes: 4,
        ageRecommendation: '6–12 tuổi',
        coverTheme: 'peach',
        illustrationType: 'chim-se',
        approvedByParent: true,
        askQuestionAfterStory: true,
        sourceType: 'builtin',
        paragraphs: [
          'Trong giờ vẽ tranh bầu trời ở lớp, Khôi vô tình làm rơi chiếc bút chì màu xanh biển mượn của bạn Lam khiến ngòi bút bị gãy đôi. Khôi lo lắng lắm, sợ nói ra thì bạn sẽ giận mình.',
          'Nhìn bức tranh của Lam đang cần tô màu nền trời, Khôi nhớ lời ba dặn: "Người dũng cảm là người dám nói thật khi mình lỡ làm sai". Cậu tiến lại gần, đưa chiếc bút và thành thật xin lỗi Lam.',
          'Nghe Khôi nói thật lòng, Lam không những không giận mà còn mỉm cười lấy cái gọt bút chì trong hộp ra: "Không sao đâu Khôi ơi, mình gọt lại một chút là thành hai đầu bút ngắn, tụi mình cùng tô chung nhé!".',
          'Nhờ lời nói trung thực của Khôi và sự rộng lượng sẻ chia của Lam, chiều hôm ấy cả hai bức tranh đều có bầu trời xanh biếc đẹp nhất lớp.',
        ],
        moralLesson: 'Sự trung thực và lòng tốt biết sẻ chia luôn giúp tình bạn thêm gắn bó và đáng quý.',
        reflectionQuestion: 'Nếu lỡ tay làm hỏng một món đồ, theo bạn nói thật ngay với ba mẹ hay bạn bè sẽ giúp mình cảm thấy thế nào?',
        reflectionSuggestions: [
          'Trong lòng thấy nhẹ nhõm và thoải mái hơn',
          'Được ba mẹ hoặc bạn bè cùng tìm cách sửa lại',
          'Trở thành người bạn nhỏ dũng cảm và đáng tin cậy',
        ],
      },
      {
        id: 'story-bau-troi-dem',
        title: 'Bí mật của những vì sao lấp lánh',
        category: 'Khám phá thế giới',
        summary: 'Chuyến du hành trí tưởng tượng ngắm bầu trời đêm để hiểu vì sao các ngôi sao lại nhấp nháy và vì sao mặt trăng đi ngủ muộn.',
        durationMinutes: 4,
        ageRecommendation: '6–12 tuổi',
        coverTheme: 'ice',
        illustrationType: 'bau-troi-dem',
        approvedByParent: true,
        askQuestionAfterStory: true,
        sourceType: 'builtin',
        paragraphs: [
          'Khi màn đêm buông xuống và ánh đèn trong phòng dịu lại, bầu trời ngoài khung cửa sổ hiện ra như một tấm chăn nhung xanh thẫm điểm hàng ngàn ngôi sao lấp lánh.',
          'Có bao giờ bạn tự hỏi vì sao các ngôi sao ở rất xa lại nhấp nháy như đang chớp mắt chào bạn không? Đó là vì ánh sáng từ các ngôi sao phải đi qua bầu khí quyển mát lành bao quanh Trái Đất của chúng mình đấy.',
          'Khi những làn gió nhẹ trên cao chuyển động, ánh sáng ngôi sao khẽ rung rinh, tạo nên vũ điệu lấp lánh dịu êm trên bầu trời đêm.',
          'Các vì sao vẫn tỏa sáng hiền hòa canh giấc ngủ cho muôn loài, cho cây cối nghỉ ngơi và cho các bạn nhỏ nạp đầy năng lượng để sáng mai thức dậy cao lớn, thông minh hơn.',
        ],
        moralLesson: 'Giấc ngủ đúng giờ vào buổi tối là lúc cơ thể và trí não của bạn lớn lên khỏe mạnh nhất.',
        reflectionQuestion: 'Trước khi nhắm mắt ngủ ngon tối nay, bạn muốn gửi lời chúc ngủ ngon tới những ai nào?',
        reflectionSuggestions: [
          'Chúc ba mẹ và cả nhà ngủ thật ngon',
          'Chúc bạn Buddy và các ngôi sao ngủ ngon',
          'Chúc ngày mai sẽ có thật nhiều niềm vui mới',
        ],
      },
    ],
    bedtimeStoryConfig: {
      bedtimeReminderTime: '20:30',
      tonightStoryId: 'story-tich-chu',
      scheduledByDate: {
        [todayKey]: 'story-tich-chu',
      },
      enablePostStoryQuestion: true,
      updatedAt: new Date().toISOString(),
    },
    growthTopics: [
      {
        id: 'journey-gratitude',
        slug: 'gratitude',
        stageOrder: 1,
        title: 'Lòng biết ơn',
        subtitle: 'Nhận ra và trân trọng những điều ấm áp quanh bạn mỗi ngày',
        landmarkName: 'Chặng 1 · Khu vườn Hướng Dương',
        themeColor: 'yellow',
        illustrationKey: 'schedule-check',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: true,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-gratitude-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Tách trà ấm mời bà và mẹ',
            promptOrStory:
              'Chiều đi học về, bà và mẹ vừa nấu xong bữa cơm thơm phức. Bạn nhỏ lễ phép bưng tách trà ấm bằng hai tay mời bà và mẹ. Nhìn nụ cười hiền từ của bà, bạn nghĩ trong lòng bà đang cảm thấy thế nào nhỉ?',
            buddySpeech:
              'Bạn nhìn bức tranh xem kìa! Chiều đi học về, bà và mẹ vừa chuẩn bị xong bữa cơm tối thơm lừng cho cả nhà. Bạn nhỏ lễ phép bưng tách trà ấm bằng hai tay mời bà cùng mẹ và nói lời cảm ơn. Khi nhìn ánh mắt lấp lánh của bà, bạn đoán xem bà đang cảm thấy thế nào nhỉ?',
            buddyWarmFeedback:
              'Khi mình nhận ra sự chăm sóc của ông bà, ba mẹ và đáp lại bằng lời cảm ơn chân thành, cả ngôi nhà sẽ tràn ngập niềm vui đó bạn!',
            status: 'experienced',
            childResponse: 'Mình đã nghe tình huống cùng Buddy',
            lastUpdatedAt: `${monthKey}-02T19:00:00.000Z`,
          },
          {
            id: 'exp-gratitude-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Khi được người thân chuẩn bị món ngon, bạn sẽ làm gì?',
            promptOrStory:
              'Nếu mẹ hoặc bà vừa nấu cho bạn một món ăn thật ngon sau giờ học, bạn sẽ chọn cách nào dưới đây?',
            buddySpeech:
              'Khi mẹ hoặc bà vừa vất vả chuẩn bị món ăn ngon cho bạn, theo bạn mình làm cách nào sẽ khiến người thân ấm lòng nhất nhỉ? Bạn thử chọn một cách nhé!',
            choices: [
              'Bưng bằng hai tay, nhìn bà và mẹ mỉm cười nói lời cảm ơn',
              'Cứ thế ngồi ăn ngay rồi chạy đi chơi đồ chơi luôn',
              'Mời cả nhà ăn cơm và phụ mẹ xếp bát đũa lên bàn',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt quá! Ánh mắt tươi vui và lời cảm ơn của bạn làm bà và mẹ quên hết mệt mỏi ngay đó!',
              'Ừm, nếu mình ăn xong rồi chạy đi ngay thì bà và mẹ có thể hơi chạnh lòng đó. Mình thử chọn cách thể hiện sự quan tâm ấm áp hơn nhé!',
              'Đáng yêu lắm! Vừa biết mời người lớn vừa phụ giúp việc nhỏ làm bữa cơm gia đình vui gấp đôi luôn!',
            ],
            buddyWarmFeedback:
              'Tuyệt vời! Mỗi lời cảm ơn hay cử chỉ quan tâm nhỏ đều làm người thân thấy hạnh phúc hơn.',
            status: 'experienced',
            childResponse: 'Bưng bằng hai tay, nhìn bà và mẹ mỉm cười nói lời cảm ơn',
            lastUpdatedAt: `${monthKey}-03T19:15:00.000Z`,
          },
          {
            id: 'exp-gratitude-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Trao lời cảm ơn và cốc nước mát hôm nay',
            promptOrStory:
              'Hôm nay, bạn hãy tự tay rót một cốc nước mát mời ông bà hoặc ba mẹ và nói lời cảm ơn vì đã chăm sóc bạn nhé!',
            buddySpeech:
              'Hôm nay chúng mình cùng biến lòng biết ơn thành một hành động nhỏ nhé! Khi ông bà hoặc ba mẹ đi làm về hay sau bữa cơm, bạn hãy rót một cốc nước mát mời bằng hai tay và nói lời cảm ơn nha. Mình tin bạn làm được!',
            actionSuggestion: 'Rót nước mời ông bà/ba mẹ bằng hai tay và nói lời cảm ơn',
            buddyWarmFeedback:
              'Yay! Chúng mình làm được rồi! Cử chỉ lễ phép và ấm áp của bạn chắc chắn đã mang lại nụ cười thật tươi cho cả nhà!',
            status: 'in_progress',
          },
          {
            id: 'exp-gratitude-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Cảm xúc của bạn khi nói lời cảm ơn',
            promptOrStory:
              'Khi bạn mời nước hoặc nói lời cảm ơn người thân, bạn cảm thấy trong lòng thế nào? Chạm vào biểu tượng cảm xúc để kể cho mình nghe nhé!',
            buddySpeech:
              'Khi bạn nói lời cảm ơn hoặc mời nước ông bà, ba mẹ hôm nay, bạn thấy nét mặt của mọi người thế nào và trong lòng bạn cảm thấy ra sao? Mình đang lắng nghe bạn đây!',
            choices: [
              'Ông bà, ba mẹ cười rất tươi và xoa đầu mình',
              'Trong lòng mình thấy vui và ấm áp lắm',
              'Mình muốn làm thêm nhiều việc nhỏ giúp gia đình',
            ],
            buddyWarmFeedback:
              'Cảm ơn bạn đã chia sẻ khoảnh khắc thật đẹp! Mình rất vui khi được lắng nghe bạn.',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-honesty',
        slug: 'honesty',
        stageOrder: 2,
        title: 'Tính trung thực',
        subtitle: 'Dũng cảm nói lời chân thật để tâm hồn luôn nhẹ nhõm',
        landmarkName: 'Chặng 2 · Suối Pha Lê Trong Vắt',
        themeColor: 'ice',
        illustrationKey: 'pencil-case',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-honesty-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Chiếc cốc nước bị đổ trên bàn',
            promptOrStory:
              'Ối! Bạn nhỏ vô tình làm đổ cốc nước chảy lênh láng trên bàn. Bạn ấy hơi lo vì sợ mẹ buồn nhưng đã quyết định nói thật. Nếu đang ở đó, bạn sẽ giúp bạn ấy thế nào nhỉ?',
            buddySpeech:
              'Ối! Chiếc cốc nước bị đổ mất rồi! Nước chảy lênh láng trên mặt bàn gỗ. Bạn nhỏ hơi lo vì sợ mẹ buồn, nhưng vẫn dũng cảm quyết định nói thật với mẹ. Nếu đang ở đó, bạn sẽ giúp bạn ấy nói với mẹ thế nào nhỉ?',
            buddyWarmFeedback:
              'Nếu bạn làm đổ cốc nước, bạn sẽ nói gì với mẹ nhỉ? Khi mình dũng cảm nói thật, lòng mình sẽ nhẹ nhõm và ấm áp lắm đó!',
            status: 'not_explored',
          },
          {
            id: 'exp-honesty-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Nếu bạn vô tình làm đổ nước, bạn sẽ nói gì với mẹ?',
            promptOrStory:
              'Khi chẳng may làm đổ nước ra bàn học, bạn sẽ chọn cách ứng xử nào dưới đây?',
            buddySpeech:
              'Nếu bạn vô tình làm đổ cốc nước trên bàn, bạn sẽ chọn cách nào nhỉ? Mình cùng suy nghĩ và thử chọn một cách nhé!',
            choices: [
              'Nói thật với mẹ ngay và lấy khăn khô cùng mẹ lau sạch bàn',
              'Lặng lẽ bỏ đi chỗ khác và giả vờ như không biết chuyện gì',
              'Nhận lỗi với mẹ và nhờ mẹ hướng dẫn cách cất sách vở khỏi ướt',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt quá! Khi bạn nói thật và chủ động lấy khăn lau bàn, mẹ sẽ rất tự hào về sự trung thực của bạn!',
              'Ừm, cách đó có thể khiến nước thấm ướt sách vở và mọi người chưa biết chuyện gì xảy ra. Mình thử nghĩ thêm một cách khác nhé!',
              'Đúng rồi đó bạn! Nói thật và nhờ mẹ hướng dẫn giúp bạn xử lý mọi việc thật nhanh và an toàn!',
            ],
            buddyWarmFeedback:
              'Đúng rồi đó bạn! Khi mình thành thật nhận lỗi và tìm cách khắc phục, mọi người sẽ càng tin tưởng và yêu quý bạn hơn.',
            status: 'not_explored',
          },
          {
            id: 'exp-honesty-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Nói thật lòng cùng người thân hôm nay',
            promptOrStory:
              'Hôm nay, nếu bạn quên một việc nhỏ hoặc làm điều gì chưa khéo, hãy thử dũng cảm nói thật với ba mẹ nhé. Mình tin bạn làm được!',
            buddySpeech:
              'Hôm nay, khi ba mẹ hỏi về việc học hay việc nhà, hoặc nếu bạn lỡ làm điều gì chưa đúng, hãy thử nói thật với ba mẹ nhé! Mình tin bạn làm được và ba mẹ sẽ luôn lắng nghe bạn!',
            actionSuggestion: 'Trả lời trung thực với ba mẹ về việc mình đã làm hoặc cần giúp đỡ',
            buddyWarmFeedback:
              'Yay! Bạn thật dũng cảm! Nói lời chân thật giúp trái tim mình nhẹ nhõm và đáng tin cậy biết bao!',
            status: 'not_explored',
          },
          {
            id: 'exp-honesty-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Cảm nhận sau khi bạn nói thật',
            promptOrStory:
              'Khi bạn thử nói thật, bạn cảm thấy thế nào? Nhẹ nhõm hơn, vui hơn hay vẫn hơi lo một chút? Mình đang lắng nghe bạn đây!',
            buddySpeech:
              'Khi bạn thử nói thật hôm nay, bạn cảm thấy thế nào? Nhẹ nhõm hơn, vui hơn hay lúc đầu vẫn hơi hồi hộp một chút? Bạn chạm chọn cảm xúc để kể cho mình nghe nhé!',
            choices: [
              'Nói thật xong mình thấy trong lòng nhẹ nhõm hơn rất nhiều',
              'Ba mẹ không mắng mà còn chỉ cho mình cách làm tốt hơn',
              'Lúc đầu hơi run nhưng nói ra rồi mình thấy rất vui',
            ],
            buddyWarmFeedback:
              'Cảm ơn bạn đã tâm sự thật lòng cùng mình! Mình rất tự hào khi có một người bạn trung thực như bạn.',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-courage',
        slug: 'courage',
        stageOrder: 3,
        title: 'Lòng dũng cảm',
        subtitle: 'Dám thử điều mới, dám đặt câu hỏi và vượt qua nỗi sợ nhỏ',
        landmarkName: 'Chặng 3 · Cây Cầu Ánh Sao',
        themeColor: 'peach',
        illustrationKey: 'take-books',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-courage-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Bước qua con đường đá nhỏ trong công viên',
            promptOrStory:
              'Trước mặt bạn nhỏ là hàng đá cuội bắc qua bãi cỏ trong công viên. Tim bạn ấy đập thình thịch vì hơi run, nhưng có mình đứng bên cạnh vẫy tay cổ vũ. Theo bạn, điều gì sẽ giúp bạn nhỏ dám bước bước đầu tiên nhỉ?',
            buddySpeech:
              'Bạn nhìn xem kìa! Trong công viên có một lối đi bằng những viên đá nhỏ thật thú vị. Bạn nhỏ đứng ở vạch xuất phát, tim đập thình thịch vì hơi hồi hộp chưa dám bước qua. Mình đang đứng bên cạnh cổ vũ bạn ấy đó! Theo bạn, làm thế nào để bạn nhỏ tự tin bước viên đá đầu tiên nhỉ?',
            buddyWarmFeedback:
              'Dũng cảm không phải là không bao giờ hồi hộp, mà là dù hơi run nhưng vẫn dám hít thở sâu và bước thử bước đầu tiên đó bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-courage-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Khi gặp một việc mới hơi hồi hộp, bạn sẽ làm gì?',
            promptOrStory:
              'Khi đứng trước một thử thách mới mẻ mà bạn hơi ngại hoặc sợ sai, bạn sẽ chọn cách nào?',
            buddySpeech:
              'Khi gặp một trò chơi mới hoặc một câu hỏi trên lớp làm bạn hơi hồi hộp, bạn nghĩ cách nào sẽ tiếp thêm sức mạnh cho mình nhỉ? Thử chọn một cách nhé!',
            choices: [
              'Hít một hơi thật sâu, nhìn thẳng và thử từng bước nhỏ một',
              'Quay lưng bỏ cuộc ngay vì sợ mình làm chưa giỏi',
              'Nhờ ba mẹ hoặc cô giáo đứng gần cổ vũ rồi tự tin thử sức',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt vời! Chỉ cần hít thở sâu và bước từng bước nhỏ, nỗi sợ sẽ nhỏ xíu lại ngay!',
              'Ừm, nếu mình bỏ cuộc ngay thì tiếc lắm vì chưa biết trò đó vui thế nào. Mình thử tìm một cách giúp mình tự tin hơn nhé!',
              'Rất thông minh! Khi có người lớn đáng tin cậy cổ vũ bên cạnh, chúng mình sẽ có thêm thật nhiều dũng khí đó!',
            ],
            buddyWarmFeedback:
              'Suy nghĩ tích cực và dám thử từng bước nhỏ chính là chiếc chìa khóa mở ra lòng dũng cảm của bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-courage-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Thử một việc mới mẻ trong hôm nay',
            promptOrStory:
              'Hôm nay, bạn hãy thử giơ tay phát biểu trên lớp, hỏi lại điều mình chưa hiểu, hoặc tập một trò vận động mới ở sân chơi nhé!',
            buddySpeech:
              'Hôm nay chúng mình cùng thử một việc dũng cảm nho nhỏ nhé! Bạn có thể giơ tay phát biểu ý kiến trên lớp, chủ động chào một người bạn mới, hoặc hỏi người lớn khi có điều chưa hiểu. Mình luôn cổ vũ bạn!',
            actionSuggestion: 'Giơ tay phát biểu, đặt câu hỏi hoặc thử một hoạt động mới mẻ',
            buddyWarmFeedback:
              'Yay! Mỗi lần bạn dám bước qua sự rụt rè là bạn đã dũng cảm và lớn khôn thêm thật nhiều đó!',
            status: 'not_explored',
          },
          {
            id: 'exp-courage-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Khoảnh khắc dũng cảm của bạn hôm nay',
            promptOrStory:
              'Sau khi dám thử làm điều mới mẻ hôm nay, bạn cảm thấy trong người thế nào? Chọn biểu tượng cảm xúc kể cho mình nghe nhé!',
            buddySpeech:
              'Lúc bạn lấy hết dũng khí để thử điều mới hôm nay, trước và sau khi làm xong bạn cảm thấy thế nào? Kể cho mình nghe với nhé!',
            choices: [
              'Lúc đầu hơi hồi hộp nhưng làm xong mình thấy vui ơi là vui',
              'Hóa ra việc đó thú vị chứ không đáng sợ như mình tưởng',
              'Lần tới mình sẽ lại tự tin thử sức tiếp',
            ],
            buddyWarmFeedback:
              'Mình vỗ tay hoan hô tinh thần dũng cảm của bạn nhé! Bạn đã cố gắng thật tuyệt vời!',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-sharing',
        slug: 'sharing',
        stageOrder: 4,
        title: 'Sự sẻ chia',
        subtitle: 'Chia sẻ niềm vui, đồ dùng và sự quan tâm với mọi người',
        landmarkName: 'Chặng 4 · Đồi Cỏ Xanh Mát',
        themeColor: 'mint',
        illustrationKey: 'plush-friends',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-sharing-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Hộp bút màu vẽ chung hai bức tranh',
            promptOrStory:
              'Giờ vẽ tranh, bạn ngồi cạnh quên mang hộp màu nên buồn thiu nhìn tờ giấy trắng. Bạn nhỏ liền đẩy hộp màu 12 cây ra giữa bàn để hai bạn cùng tô. Bạn đoán xem bức tranh hôm ấy sẽ thế nào nhỉ?',
            buddySpeech:
              'Trong giờ mỹ thuật, bạn ngồi cạnh quên mang hộp bút màu nên cứ nhìn tờ giấy trắng buồn thiu. Bạn nhỏ có hộp mười hai màu rực rỡ liền mỉm cười đặt hộp màu ra giữa bàn để hai đứa cùng tô chung. Theo bạn, chuyện gì sẽ xảy ra tiếp theo nhỉ?',
            buddyWarmFeedback:
              'Khi mình chia sẻ món đồ nhỏ với bạn, niềm vui trong lớp học sẽ nhân đôi ngay lập tức đó bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-sharing-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Nếu bạn cùng bàn quên mang bút màu, bạn sẽ làm gì?',
            promptOrStory:
              'Khi thấy bạn bên cạnh thiếu đồ dùng học tập hoặc đồ chơi mà mình đang có sẵn, bạn sẽ chọn cách nào?',
            buddySpeech:
              'Nếu bạn ngồi cạnh quên mang bút màu trong giờ vẽ, bạn nghĩ mình nên làm thế nào để cả hai cùng có giờ học vui vẻ nhỉ? Bạn thử chọn một cách nhé!',
            choices: [
              'Đặt hộp màu ở giữa bàn và rủ bạn cùng chọn màu tô tranh',
              'Che hộp màu lại dùng một mình vì sợ bút màu của mình bị mòn',
              'Cho bạn mượn cây màu bạn đang cần rồi tô luân phiên cùng nhau',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt quá! Đặt hộp màu ở giữa bàn giúp cả hai bạn đều có bức tranh rực rỡ và thêm thân thiết!',
              'Ừm, nếu giữ khư khư một mình thì bạn bên cạnh sẽ không tô được tranh và buồn lắm. Mình thử nghĩ cách vui hơn cho cả hai nhé!',
              'Cách tô luân phiên thông minh lắm! Không ai phải chờ lâu mà cả hai bức tranh đều đẹp!',
            ],
            buddyWarmFeedback:
              'Chính xác! Niềm vui khi được sẻ chia cùng bạn bè luôn lớn hơn rất nhiều.',
            status: 'not_explored',
          },
          {
            id: 'exp-sharing-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Chia sẻ món ngon hoặc đồ dùng cùng mọi người',
            promptOrStory:
              'Hôm nay, bạn hãy thử mời người thân phần trái cây, bánh ngon bạn thích, hoặc rủ bạn bè cùng chơi chung một món đồ chơi nhé!',
            buddySpeech:
              'Hôm nay mình cùng gieo niềm vui sẻ chia nhé! Bạn có thể mời ông bà, ba mẹ miếng trái cây ngọt mát, hoặc chia sẻ đồ chơi, bút màu cùng bạn bè. Làm xong bạn quay lại bấm nút báo cho mình biết nha!',
            actionSuggestion: 'Chia sẻ đồ ăn ngon, bút màu hoặc đồ chơi cùng người thân và bạn bè',
            buddyWarmFeedback:
              'Yay! Trái tim biết sẻ chia của bạn làm mọi người xung quanh vui lây đó!',
            status: 'not_explored',
          },
          {
            id: 'exp-sharing-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Cảm giác khi trao đi niềm vui',
            promptOrStory:
              'Khi bạn chia sẻ đồ dùng hoặc món ngon với người khác, bạn cảm thấy thế nào? Chọn biểu tượng cảm xúc bên dưới nhé!',
            buddySpeech:
              'Lúc bạn chia sẻ món đồ chơi hay phần bánh ngon với mọi người hôm nay, bạn thấy nụ cười của người nhận thế nào? Hãy kể cảm xúc của bạn cho mình nghe nhé!',
            choices: [
              'Mọi người cùng thưởng thức và trò chuyện rộn ràng lắm',
              'Bạn chơi chung với mình rất hào hứng và vui vẻ',
              'Mình nhận ra trao đi niềm vui cũng thích như khi được nhận quà',
            ],
            buddyWarmFeedback:
              'Trái tim ấm áp biết sẻ chia của bạn thật đáng quý! Mình rất vui khi nghe câu chuyện của bạn.',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-responsibility',
        slug: 'responsibility',
        stageOrder: 5,
        title: 'Tính trách nhiệm',
        subtitle: 'Hoàn thành phần việc của mình và giữ gìn đồ dùng ngăn nắp',
        landmarkName: 'Chặng 5 · Ngọn Hải Đăng Tin Cậy',
        themeColor: 'ice',
        illustrationKey: 'pack-books',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-resp-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Chậu hoa hướng dương và chiếc cặp ngăn nắp',
            promptOrStory:
              'Bạn nhỏ đã nhận nhiệm vụ mỗi chiều tưới nước cho chậu hoa hướng dương và xếp gọn cặp sách. Nhờ được chăm sóc đều đặn, bông hoa nở vàng rực rỡ! Bạn nghĩ điều gì sẽ xảy ra nếu mình quên tưới cây nhiều ngày nhỉ?',
            buddySpeech:
              'Bạn nhìn bức tranh xem kìa! Bạn nhỏ đang tự giác tưới nước cho chậu hoa hướng dương ngoài hiên và đã xếp chiếc cặp sách ngay ngắn bên cạnh. Nhờ bạn ấy nhớ lời hứa mỗi ngày, bông hoa hướng dương nở vàng tươi rực rỡ! Bạn thử tưởng tượng xem, nếu mình mải chơi mà quên bẵng nhiệm vụ thì chậu hoa và cặp sách sẽ ra sao nhỉ?',
            buddyWarmFeedback:
              'Nhớ lời hứa và làm trọn vẹn phần việc của mình chính là phép màu giúp cây nở hoa và mọi việc luôn suôn sẻ đó bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-resp-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Khi đang xem hoạt hình mà tới giờ soạn cặp sách, bạn sẽ làm gì?',
            promptOrStory:
              'Đã tới giờ hẹn chuẩn bị cặp sách cho ngày mai nhưng bộ phim hoạt hình vẫn đang vui, bạn sẽ chọn cách nào?',
            buddySpeech:
              'Giả sử đồng hồ báo đã tới giờ chuẩn bị cặp sách và tưới cây, nhưng bạn vẫn đang muốn chơi thêm một chút nữa. Bạn sẽ chọn cách nào nhỉ?',
            choices: [
              'Tạm dừng cuộc chơi, hoàn thành xong cặp sách đã rồi mới thư giãn tiếp',
              'Đợi ba mẹ phải làm hộ vì mình đang bận chơi',
              'Hẹn cùng Buddy làm từng bước thật gọn trong 5 phút cho xong việc',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Rất chững chạc! Làm xong phần việc của mình trước sẽ giúp bạn nghỉ ngơi thoải mái mà không lo quên bài!',
              'Ừm, đó là cặp sách đi học của chính mình mà. Nếu để ba mẹ làm thay thì sáng mai mình sẽ khó nhớ sách vở để ở ngăn nào. Mình thử cách khác nhé!',
              'Tuyệt vời! Rủ mình cùng soạn cặp 5 phút là xong vèo ngay, vừa vui vừa giữ đúng lời hứa!',
            ],
            buddyWarmFeedback:
              'Tuyệt vời! Tinh thần trách nhiệm giúp cả bạn và ba mẹ có mỗi ngày thật nhẹ nhàng và yên tâm.',
            status: 'not_explored',
          },
          {
            id: 'exp-resp-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Tự giác hoàn thành 1 nhiệm vụ không đợi nhắc',
            promptOrStory:
              'Hôm nay, bạn hãy chủ động hoàn thành việc chuẩn bị cặp sách, dọn góc học tập hoặc tưới cây trước khi ba mẹ nhắc nhé!',
            buddySpeech:
              'Hôm nay chúng mình cùng thử làm người bạn nhỏ có trách nhiệm nhé! Bạn hãy tự nhớ và hoàn thành một việc quen thuộc như chuẩn bị cặp sách, thu dọn đồ chơi hoặc chăm sóc cây nhỏ trước khi ba mẹ nhắc nha!',
            actionSuggestion: 'Tự giác soạn cặp sách, dọn bàn học hoặc tưới cây đúng giờ hẹn',
            buddyWarmFeedback:
              'Yay! Bạn đã hoàn thành phần việc của mình thật tự giác! Mình rất tự hào về bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-resp-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Cảm giác khi tự làm chủ công việc của mình',
            promptOrStory:
              'Khi tự nhớ và hoàn thành xong việc trước khi ba mẹ nhắc, bạn cảm thấy thế nào? Chọn cảm xúc kể cho mình nghe nhé!',
            buddySpeech:
              'Khi bạn tự nhớ và làm xong việc của mình mà không cần ai nhắc nhở, bạn cảm thấy trong lòng thế nào? Ba mẹ có bất ngờ không? Kể cho mình nghe với nhé!',
            choices: [
              'Ba mẹ rất bất ngờ và khen mình biết giữ lời hứa',
              'Mình thấy tự tin vì làm chủ được đồ dùng của mình',
              'Sáng hôm sau đi học mình rất thảnh thơi, không lo quên đồ',
            ],
            buddyWarmFeedback:
              'Mình rất ấn tượng với sự tự giác và đáng tin cậy của bạn!',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-perseverance',
        slug: 'perseverance',
        stageOrder: 6,
        title: 'Lòng kiên trì',
        subtitle: 'Bình tĩnh chia nhỏ việc khó và làm từng bước tới cùng',
        landmarkName: 'Chặng 6 · Đỉnh Đồi Kiến Nhỏ',
        themeColor: 'lavender',
        illustrationKey: 'building-blocks',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-pers-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Tháp gỗ cao chạm tới ngôi sao vàng',
            promptOrStory:
              'Bạn nhỏ đang xếp ngọn tháp gỗ thật cao thì khối gỗ trên cùng bị nghiêng rồi đổ xuống. Thay vì nản lòng, bạn ấy bình tĩnh xếp lại phần chân tháp thật vững. Bạn đoán xem lần này ngọn tháp có chạm tới ngôi sao không nhỉ?',
            buddySpeech:
              'Bạn nhìn bức tranh xem kìa! Bạn nhỏ đang chăm chú xếp từng khối gỗ màu sắc để xây ngọn tháp vươn tới ngôi sao vàng trên đỉnh. Lúc nãy ngọn tháp suýt bị nghiêng, nhưng bạn ấy không hề bỏ cuộc mà bình tĩnh đặt lại từng khối gỗ từ dưới lên trên thật chắc chắn. Theo bạn, điều gì đã giúp bạn nhỏ xây được ngọn tháp cao đến vậy nhỉ?',
            buddyWarmFeedback:
              'Giống như chú Kiến Nhỏ tha hạt gạo, kiên nhẫn thử lại từng bước nhỏ luôn dẫn bạn tới thành quả đáng tự hào đó!',
            status: 'not_explored',
          },
          {
            id: 'exp-pers-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Khi đang xếp hình hoặc làm bài mà gặp chỗ khó, bạn sẽ làm gì?',
            promptOrStory:
              'Nếu một mô hình xếp hình hoặc bài tập nhìn hơi khó làm bạn muốn bỏ dở, bạn sẽ chọn cách nào?',
            buddySpeech:
              'Nếu bạn đang lắp một mô hình hay làm một bài tập hơi khó mà chưa làm được ngay lần đầu, bạn sẽ chọn cách nào nhỉ? Thử chọn một cách nhé!',
            choices: [
              'Hít thở sâu, chia thành từng bước nhỏ và thử làm lại từ bước đầu',
              'Hất tung đồ chơi hoặc gấp vở lại không thèm làm nữa',
              'Nghỉ một nhịp ngắn rồi nhờ ba mẹ hoặc Buddy gợi ý chỗ chưa hiểu',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Bí quyết tuyệt vời! Chia việc lớn thành từng bước nhỏ giúp việc khó đến mấy cũng trở nên dễ dàng hơn!',
              'Ừm, nếu mình giận dỗi bỏ ngang thì công sức nãy giờ sẽ uổng phí mất. Mình thử hít thở sâu và chọn một cách bình tĩnh hơn nhé!',
              'Rất khôn ngoan! Biết nghỉ lấy sức và hỏi gợi ý khi gặp chỗ khó cũng là cách của người kiên trì đó bạn!',
            ],
            buddyWarmFeedback:
              'Cách chia nhỏ từng bước và kiên nhẫn thử lại chính là bí quyết của mọi nhà khám phá!',
            status: 'not_explored',
          },
          {
            id: 'exp-pers-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Hoàn thành trọn vẹn một việc đến bước cuối cùng',
            promptOrStory:
              'Hôm nay, bạn hãy chọn một bức tranh đang tô dở, một mô hình lắp ghép hoặc một bài học hơi khó và kiên nhẫn làm tới bước cuối cùng nhé!',
            buddySpeech:
              'Hôm nay hai đứa mình cùng rèn luyện lòng kiên trì nhé! Bạn hãy chọn một việc cần sự tỉ mỉ như tô kín một bức tranh, lắp xong một mô hình hoặc hoàn thành trọn vẹn chuỗi nhiệm vụ hôm nay đến bước cuối cùng nha!',
            actionSuggestion: 'Kiên nhẫn hoàn thành trọn vẹn một bức tranh, mô hình hoặc bài tập',
            buddyWarmFeedback:
              'Yay! Chúng mình làm được rồi! Bạn đã kiên trì đi tới tận bước cuối cùng mà không bỏ cuộc!',
            status: 'not_explored',
          },
          {
            id: 'exp-pers-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Cảm giác khi chinh phục thử thách khó',
            promptOrStory:
              'Khi kiên nhẫn làm xong việc mà lúc đầu bạn tưởng là khó, bạn cảm thấy ra sao? Chọn biểu tượng cảm xúc chia sẻ với mình nhé!',
            buddySpeech:
              'Lúc hoàn thành xong công việc mà ban đầu bạn nghĩ là hơi khó, cảm giác của bạn thế nào? Tự hào, vui sướng hay nhẹ nhõm? Kể cho mình nghe nhé!',
            choices: [
              'Mình thấy rất vui và tự hào vì đã không bỏ cuộc giữa chừng',
              'Hóa ra cứ làm từng bước nhỏ thì việc khó cũng thành dễ',
              'Mình muốn khoe thành quả ngay với ba mẹ và Buddy',
            ],
            buddyWarmFeedback:
              'Chúc mừng bạn đã chinh phục thêm một đỉnh đồi kiên trì! Sự cố gắng của bạn thật đáng khen!',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-kindness',
        slug: 'kindness',
        stageOrder: 7,
        title: 'Sự tử tế',
        subtitle: 'Trao lời nói dịu dàng và cử chỉ ân cần mỗi ngày',
        landmarkName: 'Chặng 7 · Thung Lũng Nắng Ấm',
        themeColor: 'peach',
        illustrationKey: 'sort-books',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-kind-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Chiếc ô nhỏ che mưa và giỏ trái cây giúp bà',
            promptOrStory:
              'Trời bất chợt lất phất mưa, bà cụ hàng xóm đang xách giỏ trái cây nặng bước chậm trên đường. Bạn nhỏ liền nghiêng chiếc ô che cho bà và xin phụ đỡ giỏ quà. Theo bạn, cử chỉ ấy mang lại điều kỳ diệu gì nhỉ?',
            buddySpeech:
              'Bạn nhìn bức tranh ấm áp này xem! Trời đang lất phất mưa mà bà cụ hàng xóm phải xách giỏ trái cây khá nặng. Bạn nhỏ đi ngang qua liền mỉm cười, giơ cao chiếc ô che cho bà khỏi ướt và lễ phép đưa tay đỡ phụ giỏ trái cây. Theo bạn, một hành động tử tế nhỏ như vậy sẽ làm ngày hôm ấy thay đổi thế nào nhỉ?',
            buddyWarmFeedback:
              'Một cử chỉ ân cần hay lời hỏi thăm dịu dàng tuy nhỏ bé nhưng có thể làm ấm lòng người khác suốt cả ngày đó bạn!',
            status: 'not_explored',
          },
          {
            id: 'exp-kind-2',
            typeLabel: 'Hiểu',
            type: 'understand',
            title: 'Khi thấy người thân hoặc bạn bè đang xách đồ nặng hay làm rơi đồ, bạn sẽ làm gì?',
            promptOrStory:
              'Nếu thấy bà, mẹ đang xách túi đồ hoặc một người bạn vô tình làm rơi đồ dùng, bạn sẽ chọn cách nào?',
            buddySpeech:
              'Khi nhìn thấy người thân xách đồ về nhà hoặc bạn bè lỡ tay làm rơi đồ dùng xuống sàn, bạn sẽ chọn cách ứng xử nào nhỉ? Thử chọn một cách nhé!',
            choices: [
              'Chạy lại mở cửa, nhặt giúp đồ rơi hoặc đỡ phụ món đồ vừa sức',
              'Đứng nhìn rồi đi qua luôn vì nghĩ đó không phải việc của mình',
              'Nói lời hỏi thăm dịu dàng và hỏi xem mình có thể giúp gì không',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt quá! Đôi tay nhanh nhẹn giúp đỡ đúng lúc của bạn thật ấm áp và đáng quý!',
              'Ừm, nếu mình thờ ơ đi qua thì người đang vất vả sẽ thấy tủi thân lắm. Mình thử chọn một cử chỉ quan tâm tử tế hơn nhé!',
              'Dịu dàng lắm! Một lời hỏi thăm chân thành và sẵn lòng giúp đỡ luôn làm mọi người mỉm cười!',
            ],
            buddyWarmFeedback:
              'Mỗi cử chỉ ấm áp và lời nói dịu dàng của bạn đều gieo những hạt mầm tử tế quanh mình.',
            status: 'not_explored',
          },
          {
            id: 'exp-kind-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Làm 1 việc tử tế ấm áp trong hôm nay',
            promptOrStory:
              'Hôm nay, bạn hãy thử làm một việc tử tế vừa sức: giữ cửa, xách phụ món đồ nhỏ cho ông bà/ba mẹ, hoặc nói lời động viên một người bạn nhé!',
            buddySpeech:
              'Hôm nay chúng mình cùng lan tỏa sự tử tế nhé! Bạn hãy chọn một việc nhỏ vừa sức như mở cửa đón ba mẹ, phụ ông bà cầm món đồ nhẹ, nhặt giúp đồ bị rơi hoặc nói một lời khen dịu dàng với bạn bè nha!',
            actionSuggestion: 'Phụ đỡ đồ nhẹ, giữ cửa hoặc nói lời dịu dàng động viên người thân/bạn bè',
            buddyWarmFeedback:
              'Yay! Sự tử tế và lòng tốt của bạn đã làm thế giới quanh mình rực rỡ như nắng ấm!',
            status: 'not_explored',
          },
          {
            id: 'exp-kind-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Niềm vui từ hành động tử tế của bạn',
            promptOrStory:
              'Sau khi làm một việc tử tế cho người khác hôm nay, trong lòng bạn cảm thấy thế nào? Chọn cảm xúc kể cho mình nghe nhé!',
            buddySpeech:
              'Khi bạn trao đi một cử chỉ tử tế hôm nay, bạn nhận lại được ánh mắt hay nụ cười như thế nào? Hãy chọn cảm xúc để chia sẻ cùng mình nhé!',
            choices: [
              'Mình đã giúp đỡ người khác và nhận lại nụ cười thật tươi',
              'Hôm nay cũng có người đối xử rất dịu dàng và tốt bụng với mình',
              'Mình rất thích cảm giác mọi người quan tâm và yêu thương nhau',
            ],
            buddyWarmFeedback:
              'Mình cảm nhận được hơi ấm thật đẹp từ câu chuyện tử tế của bạn!',
            status: 'not_explored',
          },
        ],
      },
      {
        id: 'journey-independence',
        slug: 'independence',
        stageOrder: 8,
        title: 'Tính tự lập',
        subtitle: 'Chủ động chăm sóc bản thân và chuẩn bị cho ngày mới',
        landmarkName: 'Chặng 8 · Ngôi Nhà Trên Cây Tự Chủ',
        themeColor: 'mint',
        illustrationKey: 'clothes-ready',
        starRewardPerExperience: 1,
        approvalStatus: 'approved',
        selectedByParent: true,
        isCurrentFocus: false,
        updatedAt: '2026-11-01T08:00:00.000Z',
        experiences: [
          {
            id: 'exp-ind-1',
            type: 'explore',
            typeLabel: 'Khám phá',
            title: 'Buổi sáng tự mặc đồng phục và buộc dây giày',
            promptOrStory:
              'Nắng sớm vừa chiếu qua khung cửa, bạn nhỏ đã tự mặc bộ đồng phục gọn gàng và cúi xuống tự thắt nút dây giày thật khéo. Bạn thấy bạn nhỏ trong tranh có ra dáng một anh chị lớn tự lập không nào?',
            buddySpeech:
              'Bạn nhìn bức tranh buổi sáng tươi vui này xem! Nắng sớm vừa gõ cửa, bạn nhỏ đã tự giác mặc bộ đồng phục phẳng phiu và ngồi thắt nút dây giày đi học bằng chính đôi tay của mình mà không cần đợi ba mẹ làm giúp. Bạn thử nghĩ xem, khi tự làm được những việc cá nhân như vậy, bạn nhỏ sẽ cảm thấy thế nào nhỉ?',
            buddyWarmFeedback:
              'Tự chăm sóc bản thân mỗi sáng chính là bước tiến tuyệt vời trên hành trình lớn khôn của bạn đó!',
            status: 'not_explored',
          },
          {
            id: 'exp-ind-2',
            type: 'understand',
            typeLabel: 'Hiểu',
            title: 'Buổi sáng trước giờ đi học, cách nào thể hiện tính tự lập?',
            promptOrStory:
              'Khi thức dậy vào buổi sáng đi học, bạn sẽ chọn cách nào để khởi đầu ngày mới thật tự chủ?',
            buddySpeech:
              'Vào buổi sáng trước giờ đến trường, theo bạn cách nào dưới đây thể hiện mình là một người bạn nhỏ tự lập và khéo léo nhỉ? Bạn thử chọn một cách nhé!',
            choices: [
              'Tự đánh răng rửa mặt, mặc quần áo và tự mang tất giày gọn gàng',
              'Nằm ì trên giường đợi ba mẹ phải mặc quần áo và đi giày hộ',
              'Tự kiểm tra lại bình nước và đeo cặp sách sẵn sàng ra cửa đúng giờ',
            ],
            recommendedChoiceIndices: [0, 2],
            choiceFeedbacks: [
              'Tuyệt vời! Tự vệ sinh cá nhân và tự mang giày giúp đôi tay bạn ngày càng khéo léo và tự chủ!',
              'Ừm, mình đã lớn hơn mỗi ngày rồi, nếu cứ đợi ba mẹ làm hộ hết thì mình sẽ mất cơ hội rèn đôi tay khéo léo đó. Mình thử cách khác nhé!',
              'Chuẩn luôn! Tự kiểm tra đồ dùng và sẵn sàng đúng giờ giúp cả nhà có buổi sáng thật vui vẻ!',
            ],
            buddyWarmFeedback:
              'Đúng vậy! Tự lập giúp bạn ngày càng vững vàng, khéo léo và làm chủ thời gian của mình.',
            status: 'not_explored',
          },
          {
            id: 'exp-ind-3',
            type: 'practice',
            typeLabel: 'Thực hành',
            title: 'Tự chuẩn bị trang phục và mang giày đi học',
            promptOrStory:
              'Hôm nay, bạn hãy tự tay soạn sẵn quần áo, tự mặc đồ và tự xỏ tất, mang giày mà không đợi ba mẹ làm giúp nhé!',
            buddySpeech:
              'Hôm nay chúng mình cùng thực hành tính tự lập nhé! Bạn hãy tự tay chuẩn bị bộ quần áo của mình, tự mặc đồ và tự xỏ tất mang giày thật gọn gàng nha. Mình tin đôi tay khéo léo của bạn sẽ làm rất tốt!',
            actionSuggestion: 'Tự soạn quần áo, tự mặc đồ và tự mang tất giày gọn gàng',
            buddyWarmFeedback:
              'Yay! Chúng mình làm được rồi! Bạn đã tự chăm sóc bản thân thật khéo léo và chững chạc!',
            status: 'not_explored',
          },
          {
            id: 'exp-ind-4',
            type: 'share',
            typeLabel: 'Chia sẻ',
            title: 'Kể về việc bạn đã tự làm thành thạo',
            promptOrStory:
              'Khi tự tay mặc đồ, mang giày hoặc chuẩn bị đồ dùng một mình, bạn cảm thấy thế nào? Chọn biểu tượng cảm xúc kể cho mình nghe nhé!',
            buddySpeech:
              'Việc nào trước đây bạn cần ba mẹ giúp nhưng bây giờ bạn đã tự làm được một mình rồi? Khi tự làm xong, bạn cảm thấy tự hào thế nào? Kể cho mình nghe với nhé!',
            choices: [
              'Mình đã tự mặc đồng phục và tự mang giày tất mỗi buổi sáng',
              'Mình tự chuẩn bị cặp sách theo thời khóa biểu mỗi tối',
              'Mình tự dọn gọn góc học tập và đồ chơi sau khi dùng xong',
            ],
            buddyWarmFeedback:
              'Bạn đã tiến một bước thật dài trên bản đồ Hành trình! Mình luôn vui và tự hào được đồng hành cùng bạn.',
            status: 'not_explored',
          },
        ],
      },
    ],
    growthLogs: [
      {
        id: 'glog-seed-1',
        topicId: 'journey-gratitude',
        topicTitle: 'Lòng biết ơn',
        experienceId: 'exp-gratitude-1',
        experienceType: 'explore',
        experienceTitle: 'Bữa cơm tối thơm lừng của mẹ',
        status: 'experienced',
        childReflection: 'Mình đã nghe tình huống cùng Buddy',
        buddyFeedback:
          'Nhận ra sự vất vả và tình thương của ba mẹ trong từng bữa ăn chính là khởi đầu đẹp nhất của lòng biết ơn đó bạn!',
        dateKey: `${monthKey}-02`,
        createdAt: `${monthKey}-02T19:00:00.000Z`,
      },
      {
        id: 'glog-seed-2',
        topicId: 'journey-gratitude',
        topicTitle: 'Lòng biết ơn',
        experienceId: 'exp-gratitude-2',
        experienceType: 'understand',
        experienceTitle: 'Lời cảm ơn mang lại điều gì?',
        status: 'experienced',
        childReflection: 'Nhìn vào mắt người ấy, mỉm cười và nói lời cảm ơn chân thành',
        buddyFeedback:
          'Tuyệt vời! Mỗi lời cảm ơn hay cử chỉ quan tâm nhỏ đều làm cả người trao và người nhận thấy hạnh phúc hơn.',
        dateKey: `${monthKey}-03`,
        createdAt: `${monthKey}-03T19:15:00.000Z`,
      },
    ],
    parentApprovals: [
      {
        id: 'approval-init-1',
        targetType: 'task',
        targetId: 'task-backpack',
        status: 'approved',
        reviewedBy: 'Phụ huynh Minh Anh',
        reviewedAt: '2026-11-01T08:00:00.000Z',
        notes: 'Đã duyệt 5 bước chuẩn bị cặp sách với tranh minh họa Warm Storybook.',
      },
      {
        id: 'approval-init-2',
        targetType: 'journey',
        targetId: 'journey-gratitude',
        status: 'approved',
        reviewedBy: 'Phụ huynh Minh Anh',
        reviewedAt: '2026-11-01T08:05:00.000Z',
        notes: 'Đã duyệt chủ đề Hành trình: Lòng biết ơn.',
      },
    ],
    chatHistory: [
      {
        id: 'msg-welcome-1',
        role: 'buddy',
        text: 'Chào Minh Anh! Mình là Buddy – người bạn đồng hành luôn sẵn sàng trò chuyện cùng bạn đây. Khi nào cần hướng dẫn chuẩn bị cặp sách, mở bản đồ Hành trình hay nghe kể chuyện, bạn cứ chạm vào mình nhé!',
        createdAt: new Date().toISOString(),
        mode: 'gemini-live',
      },
    ],
    parentSettings: {
      dailyScreenLimitMinutes: 30,
      bedtimeQuietHour: '21:00',
      requireParentConfirmationForRewards: true,
      allowVoiceInput: true,
      demoPasscode: '1234',
    },
  };
}
