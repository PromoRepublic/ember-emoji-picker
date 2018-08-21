import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('emoji-picker/symbol', 'Integration | Component | emoji picker/symbol', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{emoji-picker/symbol}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#emoji-picker/symbol}}
      template block text
    {{/emoji-picker/symbol}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
