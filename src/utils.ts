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
  return value.replace(/{{\s*/g, "{{ ").replace(/\s*}}/g, " }}");
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
  const parsedCss = css.parse(
    node.value.replace("<style>", "").replace("</style>", "")
  );

  const formattedCss = css.stringify(parsedCss, {
    indent: cssIndent,
  });

  return `${tagIndent}<style>\n${formattedCss
    .split("\n")
    .map((v) => `${tagContentIndent}${v}`)
    .join("\n")}\n${tagIndent}</style>`;
}

export function formatJS(
  node: ScriptElementNode,
  jsIndent: number,
  tagIndent: string,
  tagContentIndent: string
) {
  const regex = /<script\b[^>]*src=['"][^'"]+['"][^>]*>\s*<\/script>/i;

  if (node.value.match(regex)) {
    return `${tagIndent}${node.value}`;
  }

  const content = node.value.replace("<script>", "").replace("</script>", "");

  const result = uglifyjs.minify(
    {
      "file1.js": content,
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

  return `${tagIndent}<script>\n${result.code
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
    .trimEnd()
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
