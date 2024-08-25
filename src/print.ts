import type { AstPath, ParserOptions } from "prettier";
import type {
  AttributeNode,
  CdataNode,
  ClosingTagNode,
  DocumentNode,
  DtdNode,
  EdgeCommentNode,
  EdgeEscapedMustacheNode,
  EdgeMustacheNode,
  EdgePropsNode,
  EdgeSafeMustacheNode,
  EdgeTagNode,
  EdgeTagPropsNode,
  HtmlCommentNode,
  HtmlConditionalCommentNode,
  HtmlTextNode,
  IndentAdjustment,
  OpeningTagNode,
  ParserNode,
  ScriptElementNode,
  ScriptletNode,
  StyleElementNode,
  VoidTagNode,
  LineBreakNode,
} from "./types";
import {
  addEdgeCommentSpacing,
  addEdgeMustacheSpacing,
  addEdgeSafeMustacheSpacing,
  countLeadingSpaces,
  filterLineBreaks,
  formatCss,
  formatEdgeValue,
  formatJS,
} from "./utils";

class Printer {
  private level: number;
  private useTabs: boolean;
  private printWidth: number;
  private tabWidth: number;
  private singleAttributePerLine: boolean;
  private inlineTags = new Set([
    "a",
    "abbr",
    "acronym",
    "b",
    "bdi",
    "bdo",
    "big",
    "br",
    "button",
    "cite",
    "code",
    "data",
    "dfn",
    "em",
    "i",
    "img",
    "input",
    "kbd",
    "label",
    "mark",
    "meter",
    "q",
    "ruby",
    "rp",
    "rt",
    "s",
    "samp",
    "select",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "textarea",
    "time",
    "u",
    "var",
    "wbr",
  ]);

  constructor(options: ParserOptions) {
    this.level = 0;
    this.useTabs = options.useTabs ?? false;
    this.printWidth = options.printWidth ?? 80;
    this.tabWidth = options.tabWidth ?? 4;
    this.singleAttributePerLine = options.singleAttributePerLine ?? false;
  }

  private isInlineTag(tagName: string): boolean {
    return this.inlineTags.has(tagName);
  }

  private getIndent(
    levelOverride?: number,
    indentAdjustment: IndentAdjustment = "none"
  ) {
    const level =
      levelOverride !== undefined ? Math.max(levelOverride, 0) : this.level;
    this.adjustIndentLevel(indentAdjustment);

    return `${this.useTabs ? "\t" : " ".repeat(this.tabWidth * level)}`;
  }

  private adjustIndentLevel(indentAdjustment: IndentAdjustment) {
    if (indentAdjustment === "increase") this.level++;
    else if (indentAdjustment === "decrease") this.level--;
  }

  private formatMultilineValue(
    nodeValue: string,
    indent: string,
    indentFirstLine: boolean = true
  ) {
    return nodeValue
      .split("\n")
      .map((line, index, array) => {
        if (index === 0)
          return `${indentFirstLine ? indent : ""}${line.trim()}`;
        if (index === array.length - 1) return `${indent}${line.trim()}`;

        const originalWhitespace = countLeadingSpaces(line);
        return `${" ".repeat(Math.max(indent.length, originalWhitespace))}${line.trim()}`;
      })
      .join("\n");
  }

  private formatAttributes(attributes: AttributeNode[], indent = "") {
    return attributes
      .map((attr) =>
        attr.attributeValue
          ? `${indent}${attr.attributeName}=${addEdgeMustacheSpacing(attr.attributeValue).trim()}`
          : `${indent}${attr.attributeName.trim()}`
      )
      .join(indent ? "\n" : " ");
  }

  private formatEdgeProps(
    props: EdgePropsNode[] | EdgeMustacheNode[],
    indent = ""
  ) {
    return props
      .map((prop) => `${indent}${addEdgeMustacheSpacing(prop.value).trim()}`)
      .join(indent ? "\n" : " ");
  }

  private formatEdgeTagProps(props: EdgeTagPropsNode[], indent = "") {
    return props
      .map((prop) => `${indent}${prop.value.trim()}`)
      .join(indent ? "\n" : " ");
  }

  private formatComments(comments: EdgeCommentNode[], indent = "") {
    return comments
      .map((comment) => `${indent}${comment.value}`)
      .join(indent ? "\n" : " ");
  }

  private printDocumentNode(node: DocumentNode) {
    this.level = 0;
    return node.children
      .filter(filterLineBreaks)
      .map((child, index, array) =>
        this.handlePrint(child, array[index - 1], array[index + 1])
      )
      .join("");
  }

  private printDTDNode(node: DtdNode) {
    return `${this.getIndent()}${node.value}`;
  }

  private printStandardNode(
    node:
      | HtmlCommentNode
      | HtmlConditionalCommentNode
      | CdataNode
      | ScriptletNode
  ) {
    const isScriptlet = node.type === "scriptlet";

    return `${this.formatMultilineValue(node.value, isScriptlet ? "" : this.getIndent())}`;
  }

  private printScriptElementNode(node: ScriptElementNode) {
    return `${formatJS(node, this.tabWidth, this.getIndent(), this.getIndent(this.level + 1))}`;
  }

  private printStyleElementNode(node: StyleElementNode) {
    return `${formatCss(node, this.getIndent(), this.getIndent(this.level + 1), this.getIndent(1))}`;
  }

  private printEdgeComment(node: EdgeCommentNode) {
    return `${this.formatMultilineValue(addEdgeCommentSpacing(node.value.trim()), this.getIndent())}`;
  }

  private printEdgeMustacheNode(
    node: EdgeMustacheNode | EdgeEscapedMustacheNode | EdgeSafeMustacheNode,
    previousNode?: ParserNode,
    nextNode?: ParserNode
  ) {
    const useIndentation = !(
      previousNode?.type === "htmlText" ||
      previousNode?.type === "edgeMustache" ||
      previousNode?.type === "edgeEscapedMustache" ||
      previousNode?.type === "edgeSafeMustache" ||
      ((previousNode?.type === "openingTag" ||
        previousNode?.type === "voidTag" ||
        previousNode?.type === "closingTag") &&
        this.isInlineTag(previousNode.tagName))
    );

    const useLineBreak = !(
      nextNode?.type === "htmlText" ||
      nextNode?.type === "edgeMustache" ||
      nextNode?.type === "edgeEscapedMustache" ||
      nextNode?.type === "edgeSafeMustache" ||
      ((nextNode?.type === "openingTag" ||
        nextNode?.type === "voidTag" ||
        nextNode?.type === "closingTag") &&
        this.isInlineTag(nextNode.tagName))
    );

    let result = `${useIndentation ? this.getIndent() : ""}`;

    const nodeValue =
      node.type === "edgeSafeMustache"
        ? addEdgeSafeMustacheSpacing(node.value)
        : addEdgeMustacheSpacing(node.value);

    result += useLineBreak
      ? nodeValue.replace(/[\r\n]+/g, "").trimEnd() + "\n"
      : nodeValue;

    return result;
  }

  private printOpeningNode(
    node: OpeningTagNode | VoidTagNode,
    previousNode: ParserNode | undefined,
    nextNode: ParserNode | undefined
  ) {
    let attrs = this.formatAttributes(node.attributes);
    let edgeProps = this.formatEdgeProps(node.edgeProps);
    let edgeTagProps = this.formatEdgeTagProps(node.edgeTagProps);
    let edgeMustaches = this.formatEdgeProps(node.edgeMustaches);
    let comments = this.formatComments(node.comments);

    const combinedLength =
      `${attrs} ${edgeProps} ${edgeMustaches} ${edgeTagProps} ${comments}`
        .length;
    const indentation = this.getIndent(this.level + 1);
    const tagIndentation = this.getIndent(
      undefined,
      node.type === "openingTag" ? "increase" : "none"
    );
    const closingIndentation = this.getIndent(
      node.type === "openingTag" ? this.level - 1 : this.level
    );

    const useLineBreak =
      !this.isInlineTag(node.tagName) && nextNode?.type !== "linebreak";

    const useIndentation = !(
      (previousNode?.type === "htmlText" ||
        previousNode?.type === "edgeMustache" ||
        previousNode?.type === "edgeEscapedMustache" ||
        previousNode?.type === "edgeSafeMustache") &&
      this.isInlineTag(node.tagName)
    );

    if (combinedLength > this.printWidth || this.singleAttributePerLine) {
      const closingTag = node.type == "voidTag" ? "/>" : ">";
      attrs = this.formatAttributes(node.attributes, indentation);
      edgeProps = this.formatEdgeProps(node.edgeProps, indentation);
      edgeTagProps = this.formatEdgeTagProps(node.edgeTagProps, indentation);
      edgeMustaches = this.formatEdgeProps(node.edgeMustaches, indentation);
      comments = this.formatComments(node.comments, indentation);

      const closingNewline =
        combinedLength - 2 > 0 ? `\n${closingIndentation}` : "";

      return `${useIndentation ? tagIndentation : ""}<${node.tagName}${attrs ? `\n${attrs}` : ""}${edgeMustaches ? `\n${edgeMustaches}` : ""}${edgeProps ? `\n${edgeProps}` : ""}${
        edgeTagProps
          ? `\n${this.formatMultilineValue(edgeTagProps, indentation)}`
          : ""
      }${comments ? `\n${this.formatMultilineValue(comments, indentation)}` : ""}${closingNewline}${closingTag}${useLineBreak ? "\n" : ""}`;
    }

    const closingTag = node.type == "voidTag" ? " />" : ">";
    return `${useIndentation ? tagIndentation : ""}<${node.tagName}${attrs ? ` ${attrs}` : ""}${edgeMustaches ? ` ${edgeMustaches}` : ""}${edgeProps ? ` ${edgeProps}` : ""}${edgeTagProps ? ` ${this.formatMultilineValue(edgeTagProps, "")}` : ""}${comments ? ` ${this.formatMultilineValue(comments, "")}` : ""}${closingTag}${useLineBreak ? "\n" : ""}`;
  }

  private printClosingNode(
    node: ClosingTagNode,
    previousNode: ParserNode | undefined
  ) {
    const useIndentation =
      !this.isInlineTag(node.tagName) ||
      previousNode?.type === "linebreak" ||
      previousNode?.type === "edgeTag";

    const useLineBreakAtStart =
      previousNode?.type !== "linebreak" &&
      previousNode?.type === "closingTag" &&
      this.isInlineTag(previousNode.tagName) &&
      !this.isInlineTag(node.tagName);

    return `${useLineBreakAtStart ? "\n" : ""}${useIndentation ? this.getIndent(this.level - 1, "decrease") : this.getIndent(0, "decrease")}</${node.tagName}>`;
  }

  private printEdgeTagNode(
    node: EdgeTagNode,
    nextNode: ParserNode | undefined
  ) {
    let indentAdjustment: IndentAdjustment = "none";
    let levelOverride = this.level;

    if (node.value.includes("@end")) {
      indentAdjustment = "decrease";
      levelOverride--;
    } else if (node.value.includes("@else")) {
      levelOverride--;
    } else if (
      node.value.includes("@!") ||
      node.value.includes("@let") ||
      node.value.includes("@svg") ||
      node.value.includes("@assign") ||
      node.value.includes("@inject") ||
      node.value.includes("@eval") ||
      node.value.includes("@debugger") ||
      node.value.includes("@newError") ||
      node.value.includes("@vite") ||
      node.value.includes("@inertia") ||
      node.value.match(/^@include\(.*/)?.length ||
      node.value.match(/^@includeIf\(.*/)?.length ||
      !node.value.includes("(")
    ) {
      indentAdjustment = "none";
    } else {
      indentAdjustment = "increase";
    }

    const useLineBreak = nextNode?.type !== "linebreak";

    return formatEdgeValue(
      node,
      this.getIndent(levelOverride, indentAdjustment),
      useLineBreak
    );
  }

  private printHtmlTextNode(
    node: HtmlTextNode,
    previousNode?: ParserNode,
    nextNode?: ParserNode
  ) {
    const useIndentation = !(
      previousNode?.type === "scriptlet" ||
      previousNode?.type === "edgeMustache" ||
      previousNode?.type === "edgeSafeMustache" ||
      previousNode?.type === "edgeEscapedMustache" ||
      ((previousNode?.type === "openingTag" ||
        previousNode?.type === "voidTag" ||
        previousNode?.type === "closingTag") &&
        this.isInlineTag(previousNode.tagName))
    );

    const useLineBreak = !(
      nextNode?.type === "edgeMustache" ||
      nextNode?.type === "edgeSafeMustache" ||
      nextNode?.type === "edgeEscapedMustache" ||
      nextNode?.type === "htmlText" ||
      ((nextNode?.type === "openingTag" ||
        nextNode?.type === "voidTag" ||
        nextNode?.type === "closingTag") &&
        this.isInlineTag(nextNode.tagName)) ||
      nextNode?.type === "scriptlet"
    );

    const indentedValue = useIndentation
      ? this.getIndent() + node.value
      : node.value;

    return useLineBreak ? `${indentedValue.trimEnd()}\n` : indentedValue;
  }

  private printLineBreak(node: LineBreakNode) {
    return node.value;
  }

  handlePrint(
    node: ParserNode,
    previousNode: ParserNode | undefined,
    nextNode: ParserNode | undefined
  ): string {
    switch (node.type) {
      case "document":
        return this.printDocumentNode(node);
      case "dtd":
        return this.printDTDNode(node);
      case "htmlComment":
      case "htmlConditionalComment":
      case "cdata":
      case "scriptlet":
        return this.printStandardNode(node);
      case "scriptElement":
        return this.printScriptElementNode(node);
      case "styleElement":
        return this.printStyleElementNode(node);
      case "edgeComment":
        return this.printEdgeComment(node);
      case "edgeMustache":
      case "edgeEscapedMustache":
      case "edgeSafeMustache":
        return this.printEdgeMustacheNode(node, previousNode, nextNode);
      case "openingTag":
      case "voidTag":
        return this.printOpeningNode(node, previousNode, nextNode);
      case "closingTag":
        return this.printClosingNode(node, previousNode);
      case "edgeTag":
        return this.printEdgeTagNode(node, nextNode);
      case "htmlText":
        return this.printHtmlTextNode(node, previousNode, nextNode);
      case "linebreak":
        return this.printLineBreak(node);
      default:
        return "";
    }
  }
}

function print(path: AstPath, options: ParserOptions) {
  const node = path.getNode();

  const printer = new Printer(options);
  return printer.handlePrint(node, undefined, undefined);
}

export default print;
