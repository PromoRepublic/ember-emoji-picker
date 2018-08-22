import Component from '@ember/component';
import { run } from '@ember/runloop';
import { computed, observer } from '@ember/object';
import layout from '../templates/components/emoji-picker';
import detectEmojiSupport from 'npm:detect-emoji-support';
import { allEmoji, CATEGORIES, emojiHash, getEmojiByCategories } from '../data';
import icons from '../svg';
import $ from 'jquery';
import { storageFor } from 'ember-local-storage/helpers/storage';

const RECENT_KEY = 'recent';

export default Component.extend({
  recent: storageFor('recent'),

  doesClientSupportsEmoji: detectEmojiSupport(),
  maxSearchResultsCount: 75,
  perRow: 7,

  showRecent: true,
  maxRecentCount: computed('perRow', function() {
    return 2 * this.get('perRow');
  }),

  init() {
    this._super(...arguments);

    const
      emojiByCategories = [...getEmojiByCategories()],
      categories = [];

    if (this.get('showRecent')) {
      this._getRecentEmoji();

      categories.push({
        name: RECENT_KEY,
        icon: icons[RECENT_KEY]
      });
    }

    categories.push(...CATEGORIES.map(name => ({
      name,
      icon: icons[name]
    })));

    this.setProperties({
      emojiByCategories,
      categories
    });

    this._checkScroll = this._checkScroll.bind(this);
  },

  _activeCategory: 0,
  _searchQuery: null,
  _searchQueryFormatted: computed('_searchQuery', function() {
    const querySrc = this.get('_searchQuery');
    if (!querySrc || !querySrc.length) return null;

    const query = querySrc.trim();

    if (!query.length) return null;

    return formatString(query);
  }),

  _isSearchMode: computed('_searchQueryFormatted', function() {
    return !!this.get('_searchQueryFormatted');
  }),

  _searchObserver: observer('_isSearchMode', function() {
    //for nano scroll
    run.next(() => $(window).trigger('resize'));

    if (!this.get('_isSearchMode')) {
      this._onLeaveSearch();
    }
  }),

  _onLeaveSearch() {
    this.set('_activeCategory', 0);
    this._getRecentEmoji();
  },

  _searchResults: computed('_searchQueryFormatted', function() {
    const query = this.get('_searchQueryFormatted');

    if (!query) return;

    const
      scores = {};

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

  _getRecentEmoji() {
    const emoji = Object.entries(this.get('recent.content'))
      .sort(([name1, count2], [name2, count1]) => count1 - count2)
      .slice(0, this.get('maxRecentCount'))
      .map(([name]) => Object.assign({ name }, emojiHash[name]));

    this.set('recentEmoji', { name: RECENT_KEY, emoji });
  },

  didInsertElement() {
    this._super(...arguments);

    const
      $scroller = this.$('.nano-content'),
      $categories = this.$('.js-eep-select-section');

    this.setProperties({
      $scroller,
      $categories
    });

    $scroller.on('mousewheel', this._checkScroll);
    $scroller.on('scroll', this._checkScroll);
  },

  _checkScroll() {
    if (this.get('_isSearchMode')) return;

    const $categories = this.get('$categories');
    let activeCategory = 0;

    $categories.each((i, element) => {
      if ($(element).position().top <= 2) {
        activeCategory = i;
      } else {
        return false;
      }
    });

    this.set('_activeCategory', activeCategory);
  },

  _updateRecent(emoji) {
    const
      key = `recent.${emoji.name}`,
      currentRecord = this.get(key);

    let count = 1;

    if (currentRecord) {
      count = this.get(`${key}`) + 1;
    }

    this.set(key, count)
  },

  actions: {
    selectEmoji(emoji) {
      this.sendAction('onSelectEmoji', emoji);

      this._updateRecent(emoji);
    },

    navigate(categoryIndex) {
      const
        { $scroller, $categories } = this.getProperties('$scroller', '$categories');

      this.set('_searchQuery', null);

      if (this.get('_isSearchMode')) {
        this._onLeaveSearch();
      }

      run.next(() => {
        $scroller.scrollTop($categories.eq(categoryIndex).position().top + $scroller.scrollTop());
        this.set('_activeCategory', categoryIndex);
      });
    }
  },

  layout
});

const formatString = string => string.toLowerCase().split(/[\s|,|\-|_|:]+/).filter(word => word.length);
