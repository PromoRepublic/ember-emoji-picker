import Component from '@ember/component';
import layout from '../../templates/components/emoji-picker/nav-item';

export default Component.extend({
  classNames: ['eep-nav__item'],
  tagName: 'span',
  classNameBindings: ['isActive:is-active'],
  layout
});
