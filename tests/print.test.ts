import { describe, it, expect } from "vitest";
import print from "../src/print";
import {
  AttributeNode,
  DocumentNode,
  DtdNode,
  HtmlCommentNode,
  HtmlConditionalCommentNode,
  CdataNode,
  ScriptletNode,
  ScriptElementNode,
  StyleElementNode,
  EdgeCommentNode,
  EdgeMustacheNode,
  EdgeEscapedMustacheNode,
  EdgeSafeMustacheNode,
  OpeningTagNode,
  ClosingTagNode,
  VoidTagNode,
  EdgeTagNode,
  HtmlTextNode,
  LineBreakNode,
  ParserNode,
  EdgeTagPropsNode,
  DoNotPrintNode,
} from "../src/types";
import { AstPath, ParserOptions } from "prettier";

function createPath(node: ParserNode) {
  return {
    getNode: () => node,
  } as AstPath;
}

const options = {
  useTabs: false,
  printWidth: 80,
  tabWidth: 4,
  singleAttributePerLine: false,
} as ParserOptions;

function getOutput(node: ParserNode) {
  return print(createPath(node), options);
}

describe("printDocumentNode", () => {
  it("should correctly print a document node", () => {
    const node: DocumentNode = {
      type: "document",
      start: 0,
      end: 50,
      children: [{ type: "htmlText", value: "Hello World", start: 0, end: 11 }],
    };

    expect(getOutput(node)).toBe("Hello World\n");
  });
});

describe("printDTDNode", () => {
  it("should correctly print a DTD node", () => {
    const node: DtdNode = {
      type: "dtd",
      value: "<!DOCTYPE html>",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("<!DOCTYPE html>");
  });
});

describe("printStandardNode", () => {
  it("should correctly print an HTML comment node", () => {
    const node: HtmlCommentNode = {
      type: "htmlComment",
      value: "<!-- Comment -->",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("<!-- Comment -->");
  });

  it("should correctly print an HTML conditional comment node", () => {
    const node: HtmlConditionalCommentNode = {
      type: "htmlConditionalComment",
      value: "<![if IE]> HTML <![endif]>",
      start: 0,
      end: 28,
    };

    expect(getOutput(node)).toBe("<![if IE]> HTML <![endif]>");
  });

  it("should correctly print a CDATA node", () => {
    const node: CdataNode = {
      type: "cdata",
      value: "<![CDATA[Some data]]>",
      start: 0,
      end: 21,
    };

    expect(getOutput(node)).toBe("<![CDATA[Some data]]>");
  });

  it("should correctly print a scriptlet node", () => {
    const node: ScriptletNode = {
      type: "scriptlet",
      value: '<?php echo "Hello World"; ?>',
      start: 0,
      end: 27,
    };

    expect(getOutput(node)).toBe('<?php echo "Hello World"; ?>');
  });
});

describe("printScriptElementNode", () => {
  it("should correctly print a script element node", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: `<script>
        const x = 1;
        console.log(x);
    </script>`,
    };

    expect(getOutput(node)).toContain(
      `<script>
    const x = 1;

    console.log(x);
</script>`
    );
  });

  it("should correctly print a script element node with mustache tags", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: `<script>
        const x = {{test}};
        console.log(x);
    </script>`,
    };

    expect(getOutput(node)).toContain(
      `<script>
    const x = {{test}};

    console.log(x);
</script>`
    );
  });

  it("should correctly print a script element node with safe mustache tags", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: `<script>
        const x = {{{test}}};
        console.log(x);
    </script>`,
    };

    expect(getOutput(node)).toContain(
      `<script>
    const x = {{{test}}};

    console.log(x);
</script>`
    );
  });

  it("should correctly print a script element node with edge tags", () => {
    const node: ScriptElementNode = {
      type: "scriptElement",
      start: 0,
      end: 10,
      value: `<script>
        @if(test)
        console.log(x);
        @end
    </script>`,
    };

    expect(getOutput(node)).toContain(
      `<script>
    @if(test)
        console.log(x);
    @end

</script>`
    );
  });
});

describe("printStyleElementNode", () => {
  it("should correctly print a style element node", () => {
    const node: StyleElementNode = {
      type: "styleElement",
      start: 0,
      end: 10,
      value: "<style>body { margin: 0; }</style>",
    };

    expect(getOutput(node)).toContain(
      `<style>
    body {
        margin: 0;
    }
</style>`
    );
  });

  it("should correctly print a style element node with mustache tags", () => {
    const node: StyleElementNode = {
      type: "styleElement",
      start: 0,
      end: 10,
      value: "<style>body { margin: {{test}} }</style>",
    };

    expect(getOutput(node)).toContain(
      `<style>
    body {
        margin: {{test}}
    }
</style>`
    );
  });

  it("should correctly print a style element node with safe mustache tags", () => {
    const node: StyleElementNode = {
      type: "styleElement",
      start: 0,
      end: 10,
      value: "<style>body { margin: {{{test}}} }</style>",
    };

    expect(getOutput(node)).toContain(
      `<style>
    body {
        margin: {{{test}}}
    }
</style>`
    );
  });

  it("should correctly print a style element node with edge tags", () => {
    const node: StyleElementNode = {
      type: "styleElement",
      start: 0,
      end: 10,
      value: "<style>body { @if(test) margin: 0; @end }</style>",
    };

    expect(getOutput(node)).toContain(
      `<style>
    body {
        @if(test)
            margin: 0;
        @end
    }
</style>`
    );
  });
});

describe("printEdgeComment", () => {
  it("should correctly print an edge comment node that requires spacing", () => {
    const node: EdgeCommentNode = {
      type: "edgeComment",
      value: "{{--Edge comment--}}",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("{{-- Edge comment --}}");
  });

  it("should correctly print an edge comment node that does not require spacing", () => {
    const node: EdgeCommentNode = {
      type: "edgeComment",
      value: "{{-- Edge comment --}}",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("{{-- Edge comment --}}");
  });

  it("should correctly print an edge comment node with line breaks that does not require spacing", () => {
    const node: EdgeCommentNode = {
      type: "edgeComment",
      value: `{{--
    Edge comment
    --}}`,
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe(
      `{{--
    Edge comment
--}}`
    );
  });
});

describe("printEdgeMustacheNode", () => {
  it("should correctly print an edge mustache node that doesn't need spacing", () => {
    const node: EdgeMustacheNode = {
      type: "edgeMustache",
      value: "{{ variable }}",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("{{ variable }}\n");
  });

  it("should correctly print an edge mustache node that needs spacing", () => {
    const node: EdgeMustacheNode = {
      type: "edgeMustache",
      value: "{{variable}}",
      start: 0,
      end: 15,
    };

    expect(getOutput(node)).toBe("{{ variable }}\n");
  });

  it("should correctly print an edge escaped mustache node that doesn't need spacing", () => {
    const node: EdgeEscapedMustacheNode = {
      type: "edgeEscapedMustache",
      value: "@{{ variable }}",
      start: 0,
      end: 17,
    };

    expect(getOutput(node)).toBe("@{{ variable }}\n");
  });

  it("should correctly print an edge escaped mustache node that needs spacing", () => {
    const node: EdgeEscapedMustacheNode = {
      type: "edgeEscapedMustache",
      value: "@{{variable}}",
      start: 0,
      end: 17,
    };

    expect(getOutput(node)).toBe("@{{ variable }}\n");
  });

  it("should correctly print an edge safe mustache node that doesn't spacing", () => {
    const node: EdgeSafeMustacheNode = {
      type: "edgeSafeMustache",
      value: "{{{ safe }}}",
      start: 0,
      end: 12,
    };

    expect(getOutput(node)).toBe("{{{ safe }}}\n");
  });

  it("should correctly print an edge safe mustache node that needs spacing", () => {
    const node: EdgeSafeMustacheNode = {
      type: "edgeSafeMustache",
      value: "{{{safe}}}",
      start: 0,
      end: 12,
    };

    expect(getOutput(node)).toBe("{{{ safe }}}\n");
  });
});

describe("OpeningTagNode", () => {
  it("should format an opening tag node correctly with no attributes", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<div>\n");
  });
  it("should format an opening tag node correctly with attributes", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [
        {
          type: "attribute",
          attributeName: "class",
          attributeValue: '"container"',
        } as AttributeNode,
      ],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual('<div class="container">\n');
  });

  it("should format an opening tag node correctly with edge tag props", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [],
      edgeTagProps: [
        {
          type: "edgeTagProps",
          value: "@if(test) something @end",
        } as EdgeTagPropsNode,
      ],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<div @if(test) something @end>\n");
  });

  it("should format an opening tag node correctly with edge safe mustache props", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [
        {
          type: "edgeSafeMustache",
          value: "{{{test}}}",
        } as EdgeSafeMustacheNode,
      ],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<div {{{ test }}}>\n");
  });

  it("should format an opening tag node correctly with edge mustache props", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [
        {
          type: "edgeMustache",
          value: "{{test}}",
        } as EdgeMustacheNode,
      ],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<div {{ test }}>\n");
  });

  it("should format an opening tag node correctly with edge comment props", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [
        { type: "edgeComment", value: "{{-- test --}}" } as EdgeCommentNode,
      ],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<div {{-- test --}}>\n");
  });

  it("should format an opening tag node correctly when the props exceed print width", () => {
    const node: OpeningTagNode = {
      type: "openingTag",
      tagName: "div",
      attributes: [
        {
          type: "attribute",
          attributeName: "class",
          attributeValue: '"container"',
        } as AttributeNode,
      ],
      edgeTagProps: [
        {
          type: "edgeTagProps",
          value: "@if(test) something @end",
        } as EdgeTagPropsNode,
      ],
      edgeSafeMustaches: [
        {
          type: "edgeSafeMustache",
          value: "{{{test}}}",
        } as EdgeSafeMustacheNode,
      ],
      edgeMustaches: [
        {
          type: "edgeMustache",
          value: "{{test}}",
        } as EdgeMustacheNode,
      ],
      comments: [
        { type: "edgeComment", value: "{{-- test --}}" } as EdgeCommentNode,
      ],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(
      `<div
    class="container"
    {{ test }}
    {{{ test }}}
    @if(test) something @end
    {{-- test --}}
>\n`
    );
  });
});

describe("VoidTagNode", () => {
  it("should format an void tag node correctly with no attributes", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<img />");
  });
  it("should format an void tag node correctly with attributes", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [
        {
          type: "attribute",
          attributeName: "class",
          attributeValue: '"container"',
        } as AttributeNode,
      ],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual('<img class="container" />');
  });

  it("should format an void tag node correctly with edge tag props", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [],
      edgeTagProps: [
        {
          type: "edgeTagProps",
          value: "@if(test) something @end",
        } as EdgeTagPropsNode,
      ],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<img @if(test) something @end />");
  });

  it("should format an void tag node correctly with edge safe mustache props", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [
        {
          type: "edgeSafeMustache",
          value: "{{{test}}}",
        } as EdgeSafeMustacheNode,
      ],
      edgeMustaches: [],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<img {{{ test }}} />");
  });

  it("should format an void tag node correctly with edge mustache props", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [
        {
          type: "edgeMustache",
          value: "{{test}}",
        } as EdgeMustacheNode,
      ],
      comments: [],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<img {{ test }} />");
  });

  it("should format an void tag node correctly with edge comment props", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [],
      edgeTagProps: [],
      edgeSafeMustaches: [],
      edgeMustaches: [],
      comments: [
        { type: "edgeComment", value: "{{-- test --}}" } as EdgeCommentNode,
      ],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("<img {{-- test --}} />");
  });

  it("should format an opening tag node correctly when the props exceed print width", () => {
    const node: VoidTagNode = {
      type: "voidTag",
      tagName: "img",
      attributes: [
        {
          type: "attribute",
          attributeName: "class",
          attributeValue: '"container"',
        } as AttributeNode,
      ],
      edgeTagProps: [
        {
          type: "edgeTagProps",
          value: "@if(test) something @end",
        } as EdgeTagPropsNode,
      ],
      edgeSafeMustaches: [
        {
          type: "edgeSafeMustache",
          value: "{{{test}}}",
        } as EdgeSafeMustacheNode,
      ],
      edgeMustaches: [
        {
          type: "edgeMustache",
          value: "{{test}}",
        } as EdgeMustacheNode,
      ],
      comments: [
        { type: "edgeComment", value: "{{-- test --}}" } as EdgeCommentNode,
      ],
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(
      `<img
    class="container"
    {{ test }}
    {{{ test }}}
    @if(test) something @end
    {{-- test --}}
/>`
    );
  });
});

describe("ClosingTagNode", () => {
  it("should format a closing tag node correctly", () => {
    const node: ClosingTagNode = {
      type: "closingTag",
      tagName: "div",
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("</div>\n");
  });
});

describe("EdgeTagNode", () => {
  it("should format an inline edge tag node correctly", () => {
    const node: EdgeTagNode = {
      type: "edgeTag",
      value: "@assign(test = 1)",
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(`@assign(test = 1)\n`);
  });

  it("should format an block edge tag node correctly", () => {
    const node: EdgeTagNode = {
      type: "edgeTag",
      value: `@component('componentName', {  })
    test
@end`,
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(
      `@component('componentName', {  })
    test
@end`
    );
  });

  it("should allow edge tag to end with a tilde for swallowing lines", () => {
    const node: EdgeTagNode = {
      type: "edgeTag",
      value: `@let(name = '')~
    test
@end`,
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(
      `@let(name = '')~
    test
@end`
    );
  });
});

describe("HtmlTextNode", () => {
  it("should format an HTML text node correctly", () => {
    const node: HtmlTextNode = {
      type: "htmlText",
      value: "Hello, world!",
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual(`Hello, world!\n`);
  });
});

describe("LineBreakNode", () => {
  it("should format a line break node correctly", () => {
    const node: LineBreakNode = {
      type: "linebreak",
      value: "\n",
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("\n");
  });
});

describe("DoNotPrintNode", () => {
  it("should format a line break node correctly", () => {
    const node: DoNotPrintNode = {
      type: "doNotPrint",
      start: 0,
      end: 0,
    };

    expect(getOutput(node)).toEqual("");
  });
});

describe("prettier-ignore", () => {
  function getDocOutput(originalText: string, children: ParserNode[]) {
    const node: DocumentNode = {
      type: "document",
      start: 0,
      end: originalText.length,
      children,
    };
    const opts = { ...options, originalText } as ParserOptions;
    return print(createPath(node), opts);
  }

  describe("HTML comment: <!-- prettier-ignore -->", () => {
    it("should preserve original formatting of the next node", () => {
      const source = `<!-- prettier-ignore -->\n<div   class="x" >hello</div >`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore -->", start: 1, end: 24 },
        { type: "linebreak", value: "\n", start: 25, end: 25 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"x"', start: 32, end: 40 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 26, end: 43,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 44, end: 48 },
        { type: "closingTag", tagName: "div", start: 49, end: 55 } as ClosingTagNode,
      ]);
      expect(result).toContain("<!-- prettier-ignore -->");
      expect(result).toContain(`<div   class="x" >`);
    });

    it("should only affect the immediate next node", () => {
      const source = `<!-- prettier-ignore -->\n<div   class="x" >bad</div>\n<div class="y">good</div>`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore -->", start: 1, end: 24 },
        { type: "linebreak", value: "\n", start: 25, end: 25 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"x"', start: 32, end: 40 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 26, end: 43,
        } as OpeningTagNode,
        { type: "htmlText", value: "bad", start: 44, end: 46 },
        { type: "closingTag", tagName: "div", start: 47, end: 52 } as ClosingTagNode,
        { type: "linebreak", value: "\n", start: 53, end: 53 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"y"', start: 60, end: 68 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 54, end: 69,
        } as OpeningTagNode,
        { type: "htmlText", value: "good", start: 70, end: 73 },
        { type: "closingTag", tagName: "div", start: 74, end: 79 } as ClosingTagNode,
      ]);
      expect(result).toContain(`<div   class="x" >`);
      expect(result).toContain(`<div class="y">`);
    });
  });

  describe("Edge comment: {{-- prettier-ignore --}}", () => {
    it("should preserve original formatting of the next node", () => {
      const source = `{{-- prettier-ignore --}}\n<div   class="x" >hello</div >`;
      const result = getDocOutput(source, [
        { type: "edgeComment", value: "{{-- prettier-ignore --}}", start: 1, end: 25 },
        { type: "linebreak", value: "\n", start: 26, end: 26 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"x"', start: 33, end: 41 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 27, end: 44,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 45, end: 49 },
        { type: "closingTag", tagName: "div", start: 50, end: 56 } as ClosingTagNode,
      ]);
      expect(result).toContain("{{-- prettier-ignore --}}");
      expect(result).toContain(`<div   class="x" >`);
    });
  });

  describe("HTML comment: <!-- prettier-ignore-attribute -->", () => {
    it("should preserve all attribute formatting but still format tag structure", () => {
      const source = `<!-- prettier-ignore-attribute -->\n<div  class="x"   id="y" >hello</div>`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore-attribute -->", start: 1, end: 33 },
        { type: "linebreak", value: "\n", start: 34, end: 34 },
        {
          type: "openingTag", tagName: "div",
          attributes: [
            { type: "attribute", attributeName: "class", attributeValue: '"x"', start: 41, end: 50 } as AttributeNode,
            { type: "attribute", attributeName: "id", attributeValue: '"y"', start: 54, end: 59 } as AttributeNode,
          ],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 35, end: 61,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 62, end: 66 },
        { type: "closingTag", tagName: "div", start: 67, end: 72 } as ClosingTagNode,
      ]);
      expect(result).toContain("<!-- prettier-ignore-attribute -->");
      expect(result).toContain(`class="x"`);
      expect(result).toContain(`id="y"`);
    });
  });

  describe("Edge comment: {{-- prettier-ignore-attribute --}}", () => {
    it("should preserve all attribute formatting but still format tag structure", () => {
      const source = `{{-- prettier-ignore-attribute --}}\n<div  class="x"   id="y" >hello</div>`;
      const result = getDocOutput(source, [
        { type: "edgeComment", value: "{{-- prettier-ignore-attribute --}}", start: 1, end: 34 },
        { type: "linebreak", value: "\n", start: 35, end: 35 },
        {
          type: "openingTag", tagName: "div",
          attributes: [
            { type: "attribute", attributeName: "class", attributeValue: '"x"', start: 42, end: 51 } as AttributeNode,
            { type: "attribute", attributeName: "id", attributeValue: '"y"', start: 55, end: 60 } as AttributeNode,
          ],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 36, end: 62,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 63, end: 67 },
        { type: "closingTag", tagName: "div", start: 68, end: 73 } as ClosingTagNode,
      ]);
      expect(result).toContain("{{-- prettier-ignore-attribute --}}");
      expect(result).toContain(`class="x"`);
      expect(result).toContain(`id="y"`);
    });
  });

  describe("HTML comment: <!-- prettier-ignore-attribute (name) -->", () => {
    it("should preserve only the named attribute, format others", () => {
      const source = `<!-- prettier-ignore-attribute (id) -->\n<div  class="x"   id="y" >hello</div>`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore-attribute (id) -->", start: 1, end: 38 },
        { type: "linebreak", value: "\n", start: 39, end: 39 },
        {
          type: "openingTag", tagName: "div",
          attributes: [
            { type: "attribute", attributeName: "class", attributeValue: '"x"', start: 46, end: 55 } as AttributeNode,
            { type: "attribute", attributeName: "id", attributeValue: '"y"', start: 58, end: 64 } as AttributeNode,
          ],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 40, end: 66,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 67, end: 71 },
        { type: "closingTag", tagName: "div", start: 72, end: 77 } as ClosingTagNode,
      ]);
      expect(result).toContain("<!-- prettier-ignore-attribute (id) -->");
      expect(result).toContain(`class="x"`);
      expect(result).toContain(`id="y"`);
    });
  });

  describe("Edge comment: {{-- prettier-ignore-attribute (name) --}}", () => {
    it("should preserve only the named attribute, format others", () => {
      const source = `{{-- prettier-ignore-attribute (id) --}}\n<div  class="x"   id="y" >hello</div>`;
      const result = getDocOutput(source, [
        { type: "edgeComment", value: "{{-- prettier-ignore-attribute (id) --}}", start: 1, end: 39 },
        { type: "linebreak", value: "\n", start: 40, end: 40 },
        {
          type: "openingTag", tagName: "div",
          attributes: [
            { type: "attribute", attributeName: "class", attributeValue: '"x"', start: 47, end: 56 } as AttributeNode,
            { type: "attribute", attributeName: "id", attributeValue: '"y"', start: 59, end: 65 } as AttributeNode,
          ],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 41, end: 67,
        } as OpeningTagNode,
        { type: "htmlText", value: "hello", start: 68, end: 72 },
        { type: "closingTag", tagName: "div", start: 73, end: 78 } as ClosingTagNode,
      ]);
      expect(result).toContain("{{-- prettier-ignore-attribute (id) --}}");
      expect(result).toContain(`class="x"`);
      expect(result).toContain(`id="y"`);
    });
  });

  describe("edge cases", () => {
    it("should not crash when ignore comment is the last node", () => {
      const source = `<!-- prettier-ignore -->`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore -->", start: 1, end: 24 },
      ]);
      expect(result).toContain("<!-- prettier-ignore -->");
    });

    it("should handle multiple consecutive ignore comments", () => {
      const source = `<!-- prettier-ignore -->\n<div   class="a" >A</div>\n<!-- prettier-ignore -->\n<div   class="b" >B</div>`;
      const result = getDocOutput(source, [
        { type: "htmlComment", value: "<!-- prettier-ignore -->", start: 1, end: 24 },
        { type: "linebreak", value: "\n", start: 25, end: 25 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"a"', start: 32, end: 40 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 26, end: 43,
        } as OpeningTagNode,
        { type: "htmlText", value: "A", start: 44, end: 44 },
        { type: "closingTag", tagName: "div", start: 45, end: 50 } as ClosingTagNode,
        { type: "linebreak", value: "\n", start: 51, end: 51 },
        { type: "htmlComment", value: "<!-- prettier-ignore -->", start: 52, end: 75 },
        { type: "linebreak", value: "\n", start: 76, end: 76 },
        {
          type: "openingTag", tagName: "div",
          attributes: [{ type: "attribute", attributeName: "class", attributeValue: '"b"', start: 83, end: 91 } as AttributeNode],
          edgeTagProps: [], edgeSafeMustaches: [], edgeMustaches: [], comments: [],
          start: 77, end: 94,
        } as OpeningTagNode,
        { type: "htmlText", value: "B", start: 95, end: 95 },
        { type: "closingTag", tagName: "div", start: 96, end: 101 } as ClosingTagNode,
      ]);
      expect(result).toContain(`<div   class="a" >`);
      expect(result).toContain(`<div   class="b" >`);
    });
  });
});
