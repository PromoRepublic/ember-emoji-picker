import StorageObject from 'ember-local-storage/local/object';
import { DEFAULT_RECENT_EMOJI } from '../data';

const Storage = StorageObject.extend();

const DEFAULT_RECENT_EMOJI_DATA = DEFAULT_RECENT_EMOJI.reduce((result, name) => {
  result[name] = 0;

  return result;
}, {});

Storage.reopenClass({
  initialState() {
    return DEFAULT_RECENT_EMOJI_DATA;
  }
});

export default Storage;
