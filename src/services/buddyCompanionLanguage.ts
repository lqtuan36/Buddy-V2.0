/**
 * Buddy Companion Language Guard & Context-Aware Pronoun Normalizer (v1.4)
 *
 * Enforces Buddy's persona as a warm peer companion ("mình" – "bạn" / child's name)
 * for 6–8-year-old children rather than a parent/teacher authority figure.
 *
 * Rules:
 * 1. ONLY apply to Buddy's own spoken or written utterances (chat replies, greetings,
 *    step guide instructions/hints, praise, celebrations, and reminders spoken by Buddy).
 * 2. NEVER apply to child's own messages (`role === 'child'`), story text/character dialogues,
 *    parent-uploaded documents, or the UI navigation label "Của con".
 * 3. Strictly preserve Vietnamese classifier nouns and compound words containing "con"
 *    (e.g., "con mèo", "con đường", "con dốc", "con suối", "con số", "con vật", "trẻ con", etc.).
 * 4. Avoid appearance- or gender-based praise ("cô bé đáng yêu", "chàng trai nhỏ", "đẹp trai", "xinh gái");
 *    focus praise on effort, creativity, kindness, and task completion.
 */

// Classifier & compound nouns where "con" is NOT a pronoun addressing the child
const PROTECTED_CON_NOUN_FOLLOWERS = [
  // Animals & living creatures
  'mèo',
  'chó',
  'cún',
  'gà',
  'vịt',
  'ngỗng',
  'chim',
  'sẻ',
  'én',
  'bồ câu',
  'cá',
  'tôm',
  'cua',
  'ốc',
  'rùa',
  'thỏ',
  'sóc',
  'nhím',
  'voi',
  'hổ',
  'sư tử',
  'gấu',
  'khỉ',
  'hươu',
  'nai',
  'ngựa',
  'bò',
  'trâu',
  'lợn',
  'heo',
  'dê',
  'cừu',
  'kiến',
  'ong',
  'bướm',
  'chuồn chuồn',
  'đom đóm',
  'sâu',
  'bọ',
  'dế',
  've',
  'nhện',
  'ếch',
  'nhái',
  'rắn',
  'thằn lằn',
  'khủng long',
  'rồng',
  'vật',
  'thú',
  'mồi',
  'non',
  // Nature, geography & roads
  'đường',
  'phố',
  'hẻm',
  'ngõ',
  'dốc',
  'đèo',
  'suối',
  'sông',
  'kênh',
  'rạch',
  'mương',
  'sóng',
  'nước',
  'gió',
  'mưa',
  'bão',
  'trăng',
  // Objects, learning & body
  'số',
  'chữ',
  'tính',
  'tàu',
  'thuyền',
  'đò',
  'phao',
  'thoi',
  'diều',
  'quay',
  'lật đật',
  'rối',
  'búp bê',
  'gấu bông',
  'tem',
  'dấu',
  'lăn',
  'trỏ',
  'chuột',
  'mắt',
  'ngươi',
  'tim',
  'dao',
  'ốc vít',
  'tán',
  // Human/family compounds
  'người',
  'cái',
  'trẻ',
  'nhỏ',
  'thơ',
  'nít',
  'trai',
  'gái',
  'trưởng',
  'út',
  'nuôi',
  'ruột',
  'đẻ',
  'cháu',
  'bà',
  'em',
];

const PROTECTED_CON_PRECEDERS = [
  'bà',
  'trẻ',
  'vợ',
  'cha',
  'mẹ',
  'bố',
  'hai',
  'ba',
  'bốn',
  'năm',
  'sáu',
  'bảy',
  'tám',
  'chín',
  'mười',
  'mấy',
  'những',
  'các',
  'một',
  'từng',
  'mỗi',
];

const WB_START = '(?<![\\p{L}\\p{N}_])';
const WB_END = '(?![\\p{L}\\p{N}_])';

function vnRegex(pattern: string, flags = 'gu'): RegExp {
  return new RegExp(`${WB_START}(?:${pattern})${WB_END}`, flags);
}

const FOLLOWER_REGEX_PART = [...PROTECTED_CON_NOUN_FOLLOWERS]
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const PRECEDER_REGEX_PART = [...PROTECTED_CON_PRECEDERS]
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

/**
 * Normalizes a Buddy companion message so Buddy consistently uses "mình" – "bạn"
 * (or the child's name), avoids parental/authoritative tone, avoids appearance/gender praise,
 * and preserves noun phrases like "con mèo", "con đường", "con dốc", "con số", and UI label "Của con".
 */
export function normalizeBuddyCompanionText(
  rawText: string,
  childName?: string
): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Protect compound/classifier expressions and UI tab titles with temporary placeholders
  const protectedTokens: string[] = [];
  const stashToken = (match: string): string => {
    const idx = protectedTokens.length;
    protectedTokens.push(match);
    return `__BUDDY_KEEP_${idx}__`;
  };

  // Convert legacy child UI section references to v2.1 "của mình"
  text = text
    .replace(vnRegex('Hành trình của con', 'giu'), 'Hành trình của mình')
    .replace(vnRegex('Việc tiếp theo của con', 'giu'), 'Việc tiếp theo của mình')
    .replace(vnRegex('Ngôi sao của con', 'giu'), 'Ngôi sao của mình')
    .replace(vnRegex('Vòng quay Quà của con', 'giu'), 'Vòng quay Quà của mình')
    .replace(vnRegex('Của con', 'gu'), 'Của mình');

  // Protect "con [follower]" (e.g., "con mèo", "con đường", "con dốc", "con suối", "con số")
  const nounFollowerRegex = vnRegex(`con\\s+(?:${FOLLOWER_REGEX_PART})`, 'giu');
  text = text.replace(nounFollowerRegex, stashToken);

  // Protect "[preceder] con" compounds (e.g., "bà con", "trẻ con", "mẹ con", "cha con")
  const nounPrecederRegex = vnRegex(`(?:${PRECEDER_REGEX_PART})\\s+con`, 'giu');
  text = text.replace(nounPrecederRegex, stashToken);

  // 2. Remove gender/appearance praise and replace with effort/companion praise
  const safeName = childName?.trim() || 'bạn nhỏ';
  text = text
    .replace(
      vnRegex('chàng trai nhỏ|cô bé đáng yêu|cô bé xinh xắn|chàng trai đáng yêu', 'giu'),
      safeName
    )
    .replace(
      vnRegex('đẹp trai\\s+quá|xinh gái\\s+quá|xinh xắn\\s+quá|xinh đẹp\\s+quá', 'giu'),
      'chăm chỉ quá'
    )
    .replace(
      vnRegex('rất\\s+(?:đẹp trai|xinh gái|xinh xắn|xinh đẹp)', 'giu'),
      'rất cố gắng'
    )
    .replace(
      vnRegex('đẹp trai|xinh gái|xinh xắn|xinh đẹp', 'giu'),
      'chăm chỉ'
    );

  // 3. Replace parental/teacher self-reference if any slipped through
  text = text
    .replace(
      vnRegex('(?:mẹ|ba|bố|cô|thầy)\\s+sẽ\\s+hướng\\s+dẫn\\s+con', 'giu'),
      'mình sẽ đồng hành cùng bạn'
    )
    .replace(vnRegex('nghe\\s+lời\\s+Buddy', 'giu'), 'cùng mình thử nhé');

  // 4. Context-aware pronoun conversions ("con" addressing the child -> "bạn", "Buddy" self-ref -> "mình")
  const phraseReplacements: Array<[RegExp, string]> = [
    [vnRegex('Con\\s+chưa\\s+hiểu', 'gu'), 'Mình chưa hiểu'],
    [vnRegex('con\\s+chưa\\s+hiểu', 'gu'), 'mình chưa hiểu'],
    [vnRegex('Con\\s+hiểu\\s+rồi', 'gu'), 'Mình hiểu rồi'],
    [vnRegex('con\\s+hiểu\\s+rồi', 'gu'), 'mình hiểu rồi'],
    [vnRegex('Con\\s+làm\\s+xong', 'gu'), 'Mình làm xong'],
    [vnRegex('con\\s+làm\\s+xong', 'gu'), 'mình làm xong'],
    [vnRegex('Buddy\\s+rất\\s+tự\\s+hào\\s+về\\s+con', 'giu'), 'Mình rất vui khi đồng hành cùng bạn'],
    [vnRegex('Buddy\\s+khen\\s+con', 'giu'), 'mình khen bạn'],
    [vnRegex('Buddy\\s+chúc\\s+con', 'giu'), 'mình chúc bạn'],
    [vnRegex('cùng\\s+Buddy', 'gu'), 'cùng mình'],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    text = text.replace(pattern, replacement);
  }

  // Convert remaining standalone pronoun "Con" / "con" (since all classifier nouns & UI tabs are stashed)
  text = text
    .replace(vnRegex('Con', 'gu'), 'Bạn')
    .replace(vnRegex('con', 'gu'), 'bạn');

  // 5. Restore protected tokens
  text = text.replace(/__BUDDY_KEEP_(\d+)__/g, (_, indexStr) => {
    const idx = Number(indexStr);
    return protectedTokens[idx] ?? '';
  });

  return text;
}

/**
 * Formats text specifically for Buddy TTS playback.
 * Applies companion language normalization ONLY when `context !== 'story'`
 * so story narratives and character dialogues remain 100% untouched.
 */
export function toBuddyCompanionVoiceText(
  rawText: string,
  context: 'chat' | 'guide' | 'story' | 'celebration' | 'greeting' = 'chat',
  childName?: string
): string {
  if (context === 'story') {
    return rawText;
  }
  return normalizeBuddyCompanionText(rawText, childName);
}

export function toBuddyCompanionUiText(
  rawText: string,
  childName?: string
): string {
  return normalizeBuddyCompanionText(rawText, childName);
}
