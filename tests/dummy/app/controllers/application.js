import Controller from '@ember/controller';
import { action } from '@ember/object';

export default Controller.extend({
  show: true,

  @action
  toggle() {
    this.toggleProperty('show');
  }
});
