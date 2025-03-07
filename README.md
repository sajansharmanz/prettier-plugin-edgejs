# EdgeJS Prettier Plugin

This is an **_opinionated_** Prettier plugin for [EdgeJS (.edge)](https://edgejs.dev/ "EdgeJS") files.

# Installation

```shell
npm i prettier-plugin-edgejs
```

## Usage

Add as plugin in your prettier config

```json
{
  "plugins": ["prettier-plugin-edgejs"]
}
```

_Note: Once added you may need to restart your editor (or extension host) if you have an extension such as Prettier for VSCode so it auto-formats correctly on save, etc._

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

For block level elements opening tags, tag content and closing tags will always be on a separate line.

`<script>` and `<style>` tags can make use of edgejs tags but only 1 level deep for now. Further investigation needed to support more.

For @let, @assign, @vite, @include, html text and comments tags and alike, your formatting is respected.

The plugin will not format your attribute values for spacing, etc. There are too many combinations to make it feasible to support this accurately given my limited time towards the plugin.
