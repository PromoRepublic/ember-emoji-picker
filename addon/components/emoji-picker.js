import Component from '@glimmer/component';
import { computed, action } from '@ember/object';
import { bool } from '@ember/object/computed';
import { htmlSafe } from '@ember/template';
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
import { next } from '@ember/runloop';
import { trySet } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const RECENT_KEY = 'recent';

export default class EmojiPickerComponent extends Component {
  @storageFor('recent') recent;

  domElement;
  renderAfterInsert = false;
  doesClientSupportsEmoji = detectEmojiSupport();
  maxSearchResultsCount = 84;

  get texts() {
    return this.args.texts;
  }
  get showRecent() {
    return this.args.showRecent ?? true;
  }
  get maxRecentCount() {
    return this.args.maxRecentCount ?? 21;
  }

  @computed('emojiByCategories')
  get firstCategory() {
    const category = this.emojiByCategories[0];
    const emoji = category.emoji.slice(0, 40);
    return { name: category.name, emoji };
  }

  @computed('showRecent')
  get categories() {
    const categories = [];
    if (this.showRecent) {
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
  }

  emojiByCategories = EMOJI_BY_CATEGORIES;

  @tracked recentEmoji;
  @tracked activeCategory = RECENT_KEY;
  _searchQuery = null;
  @computed('_searchQuery')
  get _searchQueryFormatted() {
    const querySrc = this._searchQuery;
    if (!querySrc || !querySrc.length) return null;

    const query = querySrc.trim();

    if (!query.length) return null;

    return formatString(query);
  }

  @bool('_searchQueryFormatted') isSearchMode;

  @computed('_searchQueryFormatted')
  get _searchResults() {
    const query = this._searchQueryFormatted;
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
      .slice(0, this.maxSearchResultsCount);
  }

  constructor() {
    super(...arguments);

    if (this.showRecent) {
      this._getRecentEmoji();
    }

    if (!this.texts) {
      this.texts = DEFAULT_TRANSLATIONS;
    }

    this.handleScroll = this.handleScroll.bind(this);
  }

  @action
  didInsertHandler(element) {
    next(() => trySet(this, 'renderAfterInsert', true));
    this.domElement = element;

    const root = element.querySelector('.eep-select__scroller');
    root.addEventListener('scroll', this.handleScroll);
  }

  willDestroyElement() {
    const root = this.domElement.querySelector('.eep-select__scroller');
    root.removeEventListener('scroll', this.handleScroll);
  }

  _getRecentEmoji() {
    const emoji = Object.entries(this.recent?.content)
      .sort((entry1, entry2) => entry2[1] - entry1[1])
      .map(([name]) => Object.assign({ name }, emojiHash[name]))
      .slice(0, this.maxRecentCount);

    this.recentEmoji = { name: RECENT_KEY, emoji };
  }

  handleScroll(scrollEvent) {
    if (this.isSearchMode) return;
    const categories = this.domElement.querySelectorAll('[data-category]');
    const lastActive = [...categories].filter(category => category.offsetTop <= scrollEvent.target.scrollTop);
    const lastCategory = lastActive.pop();
    this.activeCategory = lastCategory ? lastCategory.dataset.category : undefined;
  }

  _updateRecent(emoji) {
    const stored = this.recent?.content;
    const timeStamp = Date.now();

    stored[emoji.name] = timeStamp;

    const entries = Object.entries(stored);

    if (entries.length > this.maxRecentCount) {
      const sorted = entries.sort((entry1, entry2) => entry2[1] - entry1[1]);

      this.recent.clear();
      for (let i = 0; i < this.maxRecentCount; i++) {
        const [name, stamp] = sorted[i];

        this.recent[name] = stamp;
      }
    } else {
      this.recent[emoji.name] = timeStamp;
    }
  }

  @action
  navigate(categoryName) {
    this._getRecentEmoji();

    if (this.isSearchMode) {
      this._searchQuery = null;
    }

    const target = this.domElement.querySelector(`[data-category="${categoryName}"]`);
    if (target) target.scrollIntoView({behavior: 'smooth'});
  }

  @action
  selectEmoji(emoji) {
    tryInvoke(this, 'onSelectEmoji', [emoji]);

    this._updateRecent(emoji);
  }

  @action
  triggerSearch(value) {
    if (!value) {
      this._getRecentEmoji();
      this.domElement.querySelector('[data-category="recent"]').scrollIntoView();
    }
  }
}

const formatString = string => string.toLowerCase().split(/[\s|,|\-|_|:]+/).filter(word => word.length);


