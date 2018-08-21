import Component from '@ember/component';
import { run } from '@ember/runloop';
import { computed, observer } from '@ember/object';
import layout from '../templates/components/emoji-picker';
import detectEmojiSupport from 'npm:detect-emoji-support';
import { allEmoji, emojiHash, getEmojiByCategories } from '../data';
import icons from '../svg';
import $ from 'jquery';

const
  { alias } = computed,
  RECENT_KEY = 'recent';

export default Component.extend({
  doesClientSupportsEmoji: detectEmojiSupport(),
  maxSearchResultsCount: 75,

  _activeCategory: 0,
  _searchQuery: null,
  _searchQueryFormatted: computed('_searchQuery', function() {
    const querySrc = this.get('_searchQuery');
    if (!querySrc || !querySrc.length) return null;

    const query = querySrc.trim();

    if (!query.length) return null;

    return formatString(query);
  }),

  _isSearchMode: alias('_searchQueryFormatted'),

  _searchObserver: observer('_isSearchMode', function() {
    //for nano scroll

    run.next(() => $(window).trigger('resize'));

    this._exitFromSearch();
  }),

  _exitFromSearch() {
    if (!this.get('_isSearchMode')) return;

    this.set('_activeCategory', 0);
    this.get('$scroller').scrollTop(0);
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
    return [];
  },

  init() {
    this._super(...arguments);

    const emojiByCategories = [{ name: RECENT_KEY, emoji: this._getRecentEmoji() }, ...getEmojiByCategories()];

    this.setProperties({
      emojiByCategories,
      categories: emojiByCategories
        .map(category => ({
          name: category.name,
          icon: icons[category.name]
        }))
    });

    this._checkScroll = this._checkScroll.bind(this);
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

  actions: {
    selectEmoji(emoji) {
      this.sendAction('onSelectEmoji', emoji);
    },

    navigate(categoryIndex) {
      const
        { $scroller, $categories } = this.getProperties('$scroller', '$categories');

      this._exitFromSearch();

      this.set('_activeCategory', categoryIndex);

      $scroller.scrollTop($categories.eq(categoryIndex).position().top + $scroller.scrollTop());
    }
  },

  layout
});

const formatString = string => string.toLowerCase().split(/[\s|,|\-|_|:]+/).filter(word => word.length);
