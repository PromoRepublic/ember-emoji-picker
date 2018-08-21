import emoji from 'npm:emojilib';

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

export const emojiHash = emoji.lib;

export const allEmoji = Object.entries(emojiHash)
  .map(([name, value]) => {
    return Object.assign({}, { name }, value);
  });

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
export const getEmojiByCategories = () => {
  const temp = CATEGORIES.reduce((result, category) => {
    result[category] = [];

    return result;
  }, {});

  allEmoji.forEach(emoji => {
    const { category } = emoji;

    temp[category].push(Object.assign({}, emoji));
  });

  return Object.entries(temp).reduce((result, [name, emoji]) => {
    result.push({
      name,
      emoji
    });

    return result;
  }, [])
};
