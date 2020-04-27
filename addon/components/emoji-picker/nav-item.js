import Component from '@ember/component';
import layout from '../../templates/components/emoji-picker/nav-item';

const BASE_CLASS = 'eep-nav__item';

export default Component.extend({
  classNames: [BASE_CLASS],
  tagName: 'span',

  init() {
    const
      classNameBindings = ['isActive:is-active'],
      name = this.get('category.name');

    classNameBindings.push(`category.name:${BASE_CLASS}--${name}`);

    this.setProperties({ classNameBindings });

    this._super(...arguments);
  },

  layout
});
