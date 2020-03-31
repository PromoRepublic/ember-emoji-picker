import emoji from 'emojilib';

/**
 * category list with order
 */
export const CATEGORIES = [
  'people',
  'animals_and_nature',
  'food_and_drink',
  'activity',
  'travel_and_places',
  'objects',
  'symbols',
  'flags',
];

export const DEFAULT_TRANSLATIONS = {
  noFound: 'No found',
  searchResults: 'Search results'
};

export const emojiHash = emoji.lib;

export const emojiHashMapper = ([name, value]) => {
  return Object.assign({}, { name }, value);
};

export const allEmoji = Object.entries(emojiHash).map(emojiHashMapper);

/**
 *  all emojis in format
 *  [
 *    {
 *      name: $category,
 *      emoji: [emoji1, emoji2, ...]
 *    },
 *    ...
 *  ]
 */
export const EMOJI_BY_CATEGORIES = (() => {
  const temp = CATEGORIES.reduce((result, category) => {
    result[category] = [];

    return result;
  }, {});

  allEmoji.forEach(emoji => {
    const { category } = emoji;

    temp[category].push(Object.assign({}, emoji));
  });

  return Object.entries(temp).map(([name, emoji]) => ({
    name,
    emoji
  }));
})();

export const DEFAULT_RECENT_EMOJI = ['wink', 'smile', 'star_struck'];
