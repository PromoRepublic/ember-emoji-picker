import Component from '@ember/component';
import layout from '../../templates/components/emoji-picker/form';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'label',
  classNames: ['eep-select__form'],
  _class: computed('class', function() {
    let classString = 'eep-input form-control';

    if (this.get('class')) {
      classString += ` ${this.get('class')}`;
    }

    return classString;
  }),
  layout
});
