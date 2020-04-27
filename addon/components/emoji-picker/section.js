import Component from '@ember/component';
import layout from '../../templates/components/emoji-picker/section';
import { computed } from '@ember/object';

export default Component.extend({
  classNames: ['eep-select-section', 'js-eep-select-section'],
  name: computed('category', 'texts', function() {
    const {category, texts} = this.getProperties('category', 'texts');

    return texts && texts[category.name] || category.name;
  }),
  layout
});
