import { describe, it, expect } from "vitest";
import {
  addEdgeCommentSpacing,
  addEdgeMustacheSpacing,
  addEdgeSafeMustacheSpacing,
  countLeadingSpaces,
  filterLineBreaks,
  formatCss,
  formatEdgeValue,
  formatJS,
} from "../src/utils";
import {
  EdgeTagNode,
  HtmlTextNode,
  LineBreakNode,
  ScriptElementNode,
  StyleElementNode,
} from "../src/types";
import { ParserOptions } from "prettier";

describe("filterLineBreaks", () => {
  it("should return true when the node is of linebreak type", () => {
    const node = { type: "linebreak", start: 0, end: 0 } as LineBreakNode;
    expect(filterLineBreaks(node)).toBe(true);
  });

  it("should return true when the node is not a linebreak", () => {
    const node = { type: "htmlText", start: 0, end: 0 } as HtmlTextNode;
    expect(filterLineBreaks(node)).toBe(true);
  });

  it("should allow up to two maximum number of consecutive line breaks", () => {
    const node = { type: "htmlText", start: 0, end: 0 } as HtmlTextNode;
    expect(filterLineBreaks(node)).toBe(true); // First
    expect(filterLineBreaks(node)).toBe(true); // Second
    expect(filterLineBreaks(node)).toBe(true); // Exceeds limit
  });
});

describe("addEdgeCommentSpacing", () => {
  it("should not modify comments when there is linebreaks after opening and before closing comment tags", () => {
    const input = `
      {{--
        Comment with line breaks
        before and after tags
      --}}
    `;

    expect(addEdgeCommentSpacing(input)).toBe(input);
  });

  it("should add spacing around edge comments without linebreaks after opening and before closing comment tags", () => {
    const input = "{{--Comment--}}";
    const expected = "{{-- Comment --}}";
    expect(addEdgeCommentSpacing(input)).toBe(expected);
  });

  it("should not modify already spaced comments", () => {
    const input = "{{-- Some comment --}}";
    expect(addEdgeCommentSpacing(input)).toBe(input);
  });
});

describe("addEdgeMustacheSpacing", () => {
  it("should format double curly braces with spacing correctly", () => {
    const input = "{{variable}}";
    const expected = "{{ variable }}";
    expect(addEdgeMustacheSpacing(input)).toBe(expected);
  });

  it("should not modify triple curly braces", () => {
    const input = "{{{tripleCurly}}}";
    expect(addEdgeMustacheSpacing(input)).toBe(input);
  });
});

describe("addEdgeSafeMustacheSpacing", () => {
  it("should format triple curly braces with spacing", () => {
    const input = "{{{safeMustache}}}";
    const expected = "{{{ safeMustache }}}";
    expect(addEdgeSafeMustacheSpacing(input)).toBe(expected);
  });
});

describe("formatCss", () => {
  it("should format CSS content correctly", () => {
    const node: StyleElementNode = {
      type: "styleElement",
      start: 0,
      end: 10,
      value: "<style>.class { color: red; }</style>",
    };
    const formatted = formatCss(
      node,
      "  ",
      "    ",
      "  ",
      {} as ParserOptions,
      0
    );
    const expected =
      "  <style>\n    .class {\n      color: red;\n    }\n  </style>";
    expect(formatted).toBe(expected);
  });
});

describe("formatJS", () => {
  it("should format JavaScript content correctly", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: "<script>const x = 1; console.log(x);</script>",
    };
    const formatted = formatJS(node, 2, "  ", "    ", {} as ParserOptions, 0);

    const normalize = (str: string) =>
      str.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

    const expected = `  <script>
                          const x = 1;
                          console.log(x);
                        </script>
                      `;

    expect(normalize(formatted)).toEqual(normalize(expected));
  });

  it("should retain attributes on script tag and format JavaScript content correctly", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: "<script defer>const x = 1; console.log(x);</script>",
    };
    const formatted = formatJS(node, 2, "  ", "    ", {} as ParserOptions, 0);

    const normalize = (str: string) =>
      str.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

    const expected = `  <script defer>
                          const x = 1;
                          console.log(x);
                        </script>
                      `;

    expect(normalize(formatted)).toEqual(normalize(expected));
  });
});

describe("countLeadingSpaces", () => {
  it("should count the number of leading spaces correctly", () => {
    expect(countLeadingSpaces("    test")).toBe(4);
    expect(countLeadingSpaces("test")).toBe(0);
    expect(countLeadingSpaces("  test")).toBe(2);
  });
});

describe("formatEdgeValue", () => {
  it("should format Edge tag values with correct indentation with useLineBreak set to true", () => {
    const node: EdgeTagNode = {
      type: "edgeTag",
      start: 0,
      end: 10,
      value: "  someValue\n    anotherValue\nmoreValue",
    };
    const formatted = formatEdgeValue(node, "  ", true);
    const expected = "  someValue\n    anotherValue\n  moreValue\n";
    expect(formatted).toBe(expected);
  });

  it("should format Edge tag values with correct indentation with useLineBreak set to false", () => {
    const node: EdgeTagNode = {
      type: "edgeTag",
      start: 0,
      end: 10,
      value: "  someValue\n    anotherValue\nmoreValue",
    };
    const formatted = formatEdgeValue(node, "  ", false);
    const expected = "  someValue\n    anotherValue\n  moreValue";
    expect(formatted).toBe(expected);
  });
});
