import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('emoji-picker/scroller', 'Integration | Component | emoji picker/scroller', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{emoji-picker/scroller}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#emoji-picker/scroller}}
      template block text
    {{/emoji-picker/scroller}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
