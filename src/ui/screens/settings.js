// Settings (US5): language, animation speed, sound and hints. Stored in the profile.
import { h, mount } from '../dom.js';
import { t, setLocale } from '../../data/i18n.js';
import { SPEEDS } from '../anim.js';

export function renderSettings(root, app) {
  const st = app.settings;

  function change(fn) {
    fn();
    app.saveSettings();
    draw();
  }

  function choice(label, options, current, onPick) {
    return h('div', { class: 'setting' },
      h('span', { class: 'setting-label' }, label),
      h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label },
        options.map(([value, text]) => h('button', {
          class: value === current ? 'active' : '',
          role: 'radio',
          'aria-checked': value === current ? 'true' : 'false',
          onclick: () => change(() => onPick(value)),
        }, text))));
  }

  function draw() {
    mount(root,
      h('section', { class: 'screen settings' },
        h('header', { class: 'screen-head' }, h('h2', {}, t('settings.title'))),
        choice(t('settings.language'), [[null, t('settings.auto')], ['fi', 'Suomi'], ['en', 'English']], st.locale, (v) => {
          st.locale = v;
          document.documentElement.lang = setLocale(v || navigator.language);
        }),
        choice(t('settings.speed'), SPEEDS.map((v) => [v, v === 0 ? t('settings.skip') : `${v}×`]), st.animSpeed, (v) => { st.animSpeed = v; }),
        choice(t('settings.sound'), [[true, t('settings.on')], [false, t('settings.off')]], st.sound, (v) => { st.sound = v; }),
        choice(t('settings.hints'), [[true, t('settings.on')], [false, t('settings.off')]], st.hints, (v) => { st.hints = v; }),
        h('p', { class: 'hint' }, t('settings.privacy')),
        h('footer', { class: 'action-bar sticky' },
          h('button', { class: 'primary', onclick: () => app.go('menu') }, t('common.back')))));
  }
  draw();
}
