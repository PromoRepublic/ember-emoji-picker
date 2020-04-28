import Component from '@ember/component';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';
import { htmlSafe } from '@ember/template';
import layout from '../templates/components/emoji-picker';
import detectEmojiSupport from 'detect-emoji-support';
import {
  allEmoji,
  CATEGORIES,
  DEFAULT_TRANSLATIONS,
  EMOJI_BY_CATEGORIES,
  emojiHash
} from '../data';
import icons from '../svg';
import { tryInvoke } from '@ember/utils';
import { storageFor } from 'ember-local-storage/helpers/storage';

const RECENT_KEY = 'recent';

export default Component.extend({
  recent: storageFor('recent'),

  doesClientSupportsEmoji: detectEmojiSupport(),
  maxSearchResultsCount: 84,

  texts: undefined, // input
  showRecent: true, //input
  maxRecentCount: 21, // input

  categories: computed('showRecent', function() {
    const categories = [];
    if (this.get('showRecent')) {
      categories.push({
        name: RECENT_KEY,
        icon: htmlSafe(icons[RECENT_KEY])
      });
    }

    categories.push(...CATEGORIES.map(name => ({
      name,
      icon: htmlSafe(icons[name])
    })));

    return categories;
  }),

  emojiByCategories: computed('texts.categories', function() {
    const texts = this.get('texts.categories');

    if (texts) {
      return [...EMOJI_BY_CATEGORIES].map(category => {
        return Object.assign(category, {
          translate: texts[category.name]
        });
      });
    }

    return EMOJI_BY_CATEGORIES
  }),

  activeCategory: RECENT_KEY,
  _searchQuery: null,
  _searchQueryFormatted: computed('_searchQuery', function() {
    const querySrc = this.get('_searchQuery');
    if (!querySrc || !querySrc.length) return null;

    const query = querySrc.trim();

    if (!query.length) return null;

    return formatString(query);
  }),

  isSearchMode: bool('_searchQueryFormatted'),

  _searchResults: computed('_searchQueryFormatted', function() {
    const query = this.get('_searchQueryFormatted');
    const scores = {};

    if (!query) return;

    allEmoji
      .forEach(emoji => {
        const
          { name, keywords } = emoji,
          incrementScore = (name, incrementBy = 1) => {
            if (typeof scores[name] === 'undefined') {
              scores[name] = 0;
            }

            scores[name] += incrementBy;
          };

        query.forEach((string, i) => {
          let wasScored = false;
          const nameSubIndex = formatString(name).join(' ').indexOf(string);
          if (i > 0 && typeof scores[name] === 'undefined') return;

          if (~nameSubIndex) {
            wasScored = true;
            incrementScore(name, 100 - nameSubIndex);
          }

          keywords.forEach(keyword => {
            const keywordSubIndex = keyword.indexOf(string);
            if (~keywordSubIndex) {
              wasScored = true;
              incrementScore(name, (100 - keywordSubIndex) / 100);
            }
          });

          if (i > 0 && !wasScored) {
            delete scores[name];
          }
        });
      });

    return Object.keys(scores)
      .map(name => Object.assign({}, { name }, emojiHash[name]))
      .sort(({ name: name1 }, { name: name2 }) => scores[name2] - scores[name1])
      .slice(0, this.get('maxSearchResultsCount'));
  }),

  init() {
    this._super(...arguments);

    if (this.get('showRecent')) {
      this._getRecentEmoji();
    }

    if (!this.get('texts')) {
      this.set('texts', DEFAULT_TRANSLATIONS);
    }

    this.handleScroll = this.handleScroll.bind(this);
  },

  didInsertElement() {
    this._super(...arguments);

    const root = this.element.querySelector('.eep-select__scroller');
    root.addEventListener('scroll', this.handleScroll);
  },

  willDestroyElement() {
    this._super(...arguments);

    const root = this.element.querySelector('.eep-select__scroller');
    root.removeEventListener('scroll', this.handleScroll);
  },

  _getRecentEmoji() {
    const emoji = Object.entries(this.get('recent.content'))
      .sort((entry1, entry2) => entry2[1] - entry1[1])
      .map(([name]) => Object.assign({ name }, emojiHash[name]))
      .slice(0, this.get('maxRecentCount'));

    this.set('recentEmoji', { name: RECENT_KEY, emoji });
  },

  handleScroll(scrollEvent) {
    const categories = this.element.querySelectorAll('[data-category]');
    const lastActive = [...categories].filter(category => category.offsetTop <= scrollEvent.target.scrollTop);
    this.set('activeCategory', lastActive.pop().dataset.category);
  },

  _updateRecent(emoji) {
    const stored = this.get('recent.content');
    const timeStamp = Date.now();

    stored[emoji.name] = timeStamp;

    const entries = Object.entries(stored);

    if (entries.length > this.get('maxRecentCount')) {
      const sorted = entries.sort((entry1, entry2) => entry2[1] - entry1[1]);

      this.get('recent').clear();
      for (let i = 0; i < this.get('maxRecentCount'); i++) {
        const [name, stamp] = sorted[i];

        this.set(`recent.${name}`, stamp);
      }
    } else {
      this.set(`recent.${emoji.name}`, timeStamp);
    }
  },

  actions: {
    selectEmoji(emoji) {
      tryInvoke(this, 'onSelectEmoji', [emoji]);

      this._updateRecent(emoji);
    },

    navigate(categoryName) {
      this._getRecentEmoji();

      if (this.get('isSearchMode')) {
        this.set('_searchQuery', null);
      }

      const target = this.element.querySelector(`[data-category="${categoryName}"]`);
      if (target) target.scrollIntoView({behavior: 'smooth'});
    },
    triggerSearch(value) {
      if (!value) {
        this._getRecentEmoji();
        this.element.querySelector('[data-category="recent"]').scrollIntoView();
      }
    }
  },

  layout
});

const formatString = string => string.toLowerCase().split(/[\s|,|\-|_|:]+/).filter(word => word.length);


