import css from "css";
import uglifyjs from "uglify-js";
import {
  EdgeTagNode,
  ParserNode,
  ScriptElementNode,
  StyleElementNode,
} from "./types";

const MAX_CONSECUTIVE_LINE_BREAKS = 2;
let consecutiveCount = 0;

export function filterLineBreaks(node: ParserNode) {
  if (node.type !== "linebreak") {
    consecutiveCount = 0;
    return true;
  }

  consecutiveCount++;
  return consecutiveCount <= MAX_CONSECUTIVE_LINE_BREAKS;
}

export function addEdgeCommentSpacing(value: string): string {
  if (!value.includes("{{--\n")) {
    value.replace(/{{--/g, "{{-- ");
  }

  if (!value.includes("\n--}}")) {
    value.replace(/--}}/g, " --}}");
  }

  return value;
}

export function addEdgeMustacheSpacing(value: string): string {
  // Temporarily replace triple curly braces with a placeholder
  const tripleCurlyRegex = /{{{[^{}]*}}}/g;
  const tripleCurlyPlaceholder = "__TRIPLE_CURLY__";
  const tripleCurlyContent: string[] = [];

  // Replace triple curly braces with placeholders
  value = value.replace(tripleCurlyRegex, (match) => {
    const placeholder = `${tripleCurlyPlaceholder}${tripleCurlyContent.length}`;
    tripleCurlyContent.push(match);
    return placeholder;
  });

  // Format double curly braces {{ ... }} but not triple curly braces {{{ ... }}}
  value = value
    .replace(/{{\s*/g, "{{ ") // Match `{{` without preceding another `{`
    .replace(/\s*}}/g, " }}"); // Match `}}` without following another `}`

  // Restore triple curly braces content
  tripleCurlyContent.forEach((content, index) => {
    value = value.replace(`${tripleCurlyPlaceholder}${index}`, content);
  });

  return value;
}

export function addEdgeSafeMustacheSpacing(value: string): string {
  return value.replace(/{{{\s*/g, "{{{ ").replace(/\s*}}}/g, " }}}");
}

export function formatCss(
  node: StyleElementNode,
  tagIndent: string,
  tagContentIndent: string,
  cssIndent: string
) {
  // Regular expressions to match various tags
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  const mustacheTagRegex = /{{.*?}}/g;
  const safeMustacheTagRegex = /{{{.*?}}}/g;

  // Extract CSS content, stripping <style> tags
  const processedContent = node.value.replace(styleRegex, (_, cssContent) => {
    // Replace Edge tags with placeholders
    let placeholders: string[] = [];
    let placeholderIndex = 0;

    // Replace Safe Mustache tags with placeholders
    cssContent = cssContent.replace(
      safeMustacheTagRegex,
      (safeMustacheMatch: string) => {
        const placeholder = `__SAFE_MUSTACHE_TAG_${placeholderIndex++}__;`;
        placeholders.push(safeMustacheMatch);
        return placeholder;
      }
    );

    // Replace Mustache tags with placeholders
    cssContent = cssContent.replace(
      mustacheTagRegex,
      (mustacheMatch: string) => {
        const placeholder = `__MUSTACHE_TAG_${placeholderIndex++}__;`;
        placeholders.push(mustacheMatch);
        return placeholder;
      }
    );

    // Parse and format the CSS
    const parsedCss = css.parse(cssContent);
    const formattedCss = css.stringify(parsedCss, { indent: cssIndent });

    // Reinsert placeholders
    const formattedContent = formattedCss
      .replace(/__MUSTACHE_TAG_\d+__;/g, (placeholder) => {
        const index = parseInt(placeholder.match(/\d+/)![0], 10);
        return placeholders[index];
      })
      .replace(/__SAFE_MUSTACHE_TAG_\d+__;/g, (placeholder) => {
        const index = parseInt(placeholder.match(/\d+/)![0], 10);
        return placeholders[index];
      });

    return `${tagIndent}<style>\n${formattedContent
      .split("\n")
      .map((v) => `${tagContentIndent}${v}`)
      .join("\n")}\n${tagIndent}</style>`;
  });

  return processedContent;
}

export function formatJS(
  node: ScriptElementNode,
  jsIndent: number,
  tagIndent: string,
  tagContentIndent: string
) {
  // Regular expressions to match various tags
  const scriptTagRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/i;
  const mustacheTagRegex = /{{.*?}}/g;
  const safeMustacheTagRegex = /{{{.*?}}}/g;

  // Extract the attributes and content from the <script> tag
  const match = node.value.match(scriptTagRegex);
  if (!match) {
    throw new Error("Invalid <script> tag format");
  }

  const [_fullMatch, attributes, scriptContent] = match;

  // Replace Edge tags with placeholders
  let placeholders: string[] = [];
  let placeholderIndex = 0;

  let processedContent = scriptContent
    .replace(safeMustacheTagRegex, (safeMustacheMatch: string) => {
      const placeholder = `__SAFE_MUSTACHE_TAG_${placeholderIndex++}__`;
      placeholders.push(safeMustacheMatch);
      return placeholder;
    })
    .replace(mustacheTagRegex, (mustacheMatch: string) => {
      const placeholder = `__MUSTACHE_TAG_${placeholderIndex++}__`;
      placeholders.push(mustacheMatch);
      return placeholder;
    });

  // Minify and format the JavaScript
  const result = uglifyjs.minify(
    {
      "file1.js": processedContent,
    },
    {
      compress: false,
      keep_fnames: true,
      mangle: false,
      output: {
        beautify: true,
        comments: "all",
        indent_level: jsIndent,
      },
    }
  );

  if (result.error) {
    throw new Error(JSON.stringify(result.error));
  }

  // Reinsert placeholders
  const formattedContent = result.code
    .replace(/__SAFE_MUSTACHE_TAG_\d+__/g, (placeholder) => {
      const index = parseInt(placeholder.match(/\d+/)![0], 10);
      return placeholders[index];
    })
    .replace(/__MUSTACHE_TAG_\d+__/g, (placeholder) => {
      const index = parseInt(placeholder.match(/\d+/)![0], 10);
      return placeholders[index];
    });

  // Return the formatted JavaScript wrapped with <script> tags, preserving the attributes
  return `${tagIndent}<script${attributes}>\n${formattedContent
    .split("\n")
    .map((value) => `${tagContentIndent}${value}`)
    .join("\n")}\n${tagIndent}</script>`;
}

export function countLeadingSpaces(value: string) {
  const match = value.match(/^\s*/);
  return match ? match[0].length : 0;
}

export function formatEdgeValue(
  node: EdgeTagNode,
  indent: string,
  useLineBreak: boolean
) {
  return `${indent}${node.value
    .split("\n")
    .map((value, index) => {
      if (index === 0) {
        return `${value.trim()}`;
      }

      if (index === node.value.split("\n").length - 1) {
        return `${indent}${value.trim()}`;
      }

      const originalWhitespace = countLeadingSpaces(value);
      return `${" ".repeat(Math.max(indent.length, originalWhitespace))}${value.trim()}`;
    })
    .join("\n")
    .replace(/[^\S\r\n]+$/g, "")}${useLineBreak ? "\n" : ""}`;
}
