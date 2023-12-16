module.exports = {
  'extends': [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
  ],
  'plugins': [
    'stylelint-scss',
  ],
  'rules': {
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
    'color-function-notation': null,
    'at-rule-no-unknown': null,
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment', 'blockless-after-blockless'],
      }
    ],
    'media-feature-range-notation': null,
    'declaration-block-no-redundant-longhand-properties': [
      true,
      {
        ignoreShorthands: ['inset'],
      }
    ],
    'scss/at-rule-no-unknown': true,
    'scss/double-slash-comment-empty-line-before': null,
  },
}