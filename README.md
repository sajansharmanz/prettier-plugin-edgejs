# EdgeJS Prettier Plugin

This is an **_opinionated_** Prettier plugin for [EdgeJS (.edge)](https://edgejs.dev/ "EdgeJS") files.

# Installation

```shell
npm i prettier-edgejs
```

## Usage

Add as plugin in your prettier config

```json
{
  "plugins": ["prettier-edgejs"]
}
```

_Note: Once added you may need to restart your editor if you have an extension such as Prettier for VSCode so it auto-formats correctly on save, etc._

# Configuration

The plugin currently handles a few different prettier configurations

1. **useTabs** (default: false)
2. **printWidth** (default: 80)
3. **tabWidth** (default: 4)
4. **singleAttributePerLine** (default: false)

## Contributing

As with most open source projects my time is limited and I do the best I can.

If you spot an issue, feel free to open a Bug and I will get too it when I can, or even better yet feel free to open a PR.

# Notes

If the printWidth is exceeded for any HTML tag, the plugin will default to having a single attribute per line to improve readability.

Opening tags, tag content and closing tags will always be on separate lines as it improves readability.

For @let tags, your formatting is respected. Only the opening @let and the bracket will be formatted otherwise.

The plugin will not format your attribute values for spacing, etc. There are too many combinations to make it feasible to support this accurately.
