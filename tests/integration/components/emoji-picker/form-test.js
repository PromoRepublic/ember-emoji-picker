import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | emoji picker/form', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });

    await render(hbs`{{emoji-picker/form}}`);

    assert.dom('*').hasText('');

    // Template block usage:
    await render(hbs`
      {{#emoji-picker/form}}
        template block text
      {{/emoji-picker/form}}
    `);

    assert.dom('*').hasText('template block text');
  });
});
