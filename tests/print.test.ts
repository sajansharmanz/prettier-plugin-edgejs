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
