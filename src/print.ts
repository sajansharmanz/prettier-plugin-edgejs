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

  constructor(options: ParserOptions) {
    this.level = 0;
    this.useTabs = options.useTabs ?? false;
    this.printWidth = options.printWidth ?? 80;
    this.tabWidth = options.tabWidth ?? 4;
    this.singleAttributePerLine = options.singleAttributePerLine ?? false;
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
          ? `${indent}${attr.attributeName}=${addEdgeMustacheSpacing(attr.attributeValue)}`
          : `${indent}${attr.attributeName}`
      )
      .join(indent ? "\n" : " ");
  }

  private formatEdgeProps(
    props: EdgePropsNode[] | EdgeMustacheNode[],
    indent = ""
  ) {
    return props
      .map((prop) => `${indent}${addEdgeMustacheSpacing(prop.value)}`)
      .join(indent ? "\n" : " ");
  }

  private formatEdgeTagProps(props: EdgeTagPropsNode[], indent = "") {
    return props
      .map((prop) => `${indent}${prop.value}`)
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
      .map((child, index, array) =>
        this.handlePrint(child, array[index - 1], array[index + 1])
      )
      .join("");
  }

  private printDTDNode(node: DtdNode) {
    return `${this.getIndent()}${node.value}\n`;
  }

  private printStandardNode(
    node:
      | HtmlCommentNode
      | HtmlConditionalCommentNode
      | CdataNode
      | ScriptletNode
  ) {
    return `${this.formatMultilineValue(node.value, this.getIndent())}\n`;
  }

  private printScriptElementNode(node: ScriptElementNode) {
    return `${formatJS(node, this.tabWidth, this.getIndent(), this.getIndent(this.level + 1))}\n`;
  }

  private printStyleElementNode(node: StyleElementNode) {
    return `${formatCss(node, this.getIndent(), this.getIndent(this.level + 1), this.getIndent(1))}\n`;
  }

  private printEdgeComment(node: EdgeCommentNode) {
    return `${this.formatMultilineValue(addEdgeCommentSpacing(node.value.trim()), this.getIndent())}\n`;
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
      (previousNode?.type === "openingTag" &&
        previousNode.tagName === "textarea")
    );

    const useLineBreak = !(
      nextNode?.type === "htmlText" ||
      nextNode?.type === "edgeMustache" ||
      nextNode?.type === "edgeEscapedMustache" ||
      nextNode?.type === "edgeSafeMustache" ||
      (nextNode?.type === "closingTag" && nextNode.tagName === "textarea")
    );

    let result = `${useIndentation ? this.getIndent() : ""}`;

    const nodeValue =
      node.type === "edgeSafeMustache"
        ? addEdgeSafeMustacheSpacing(node.value)
        : addEdgeMustacheSpacing(node.value);

    result += useLineBreak ? nodeValue.trimEnd() : nodeValue;
    result += useLineBreak ? "\n" : "";

    return result;
  }

  private printOpeningNode(node: OpeningTagNode | VoidTagNode) {
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

    if (combinedLength > this.printWidth || this.singleAttributePerLine) {
      attrs = this.formatAttributes(node.attributes, indentation);
      edgeProps = this.formatEdgeProps(node.edgeProps, indentation);
      edgeTagProps = this.formatEdgeTagProps(node.edgeTagProps, indentation);
      edgeMustaches = this.formatEdgeProps(node.edgeMustaches, indentation);
      comments = this.formatComments(node.comments, indentation);

      const closingNewline =
        combinedLength - 2 > 0 ? `\n${closingIndentation}` : "";

      return `${tagIndentation}<${node.tagName}${attrs ? `\n${attrs}` : ""}${edgeMustaches ? `\n${edgeMustaches}` : ""}${edgeProps ? `\n${edgeProps}` : ""}${
        edgeTagProps
          ? `\n${this.formatMultilineValue(edgeTagProps, indentation)}`
          : ""
      }${comments ? `\n${this.formatMultilineValue(comments, indentation)}` : ""}${closingNewline}>${node.tagName === "textarea" ? "" : "\n"}`;
    }

    return `${tagIndentation}<${node.tagName}${attrs ? ` ${attrs}` : ""}${edgeMustaches ? ` ${edgeMustaches}` : ""}${edgeProps ? ` ${edgeProps}` : ""}${edgeTagProps ? ` ${this.formatMultilineValue(edgeTagProps, "")}` : ""}${comments ? ` ${this.formatMultilineValue(comments, "")}` : ""}>${node.tagName === "textarea" ? "" : "\n"}`;
  }

  private printClosingNode(node: ClosingTagNode) {
    const useIndentation = !(node.tagName === "textarea");

    return `${useIndentation ? this.getIndent(this.level - 1, "decrease") : this.getIndent(0, "decrease")}</${node.tagName}>\n`;
  }

  private printEdgeTagNode(node: EdgeTagNode) {
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
      node.value.includes("@assign") ||
      node.value.includes("@vite") ||
      node.value.match(/^@include\(.*/)?.length ||
      node.value.match(/^@includeIf\(.*/)?.length ||
      !node.value.includes("(")
    ) {
      indentAdjustment = "none";
    } else {
      indentAdjustment = "increase";
    }

    return formatEdgeValue(
      node,
      this.getIndent(levelOverride, indentAdjustment)
    );
  }

  private printHtmlTextNode(
    node: HtmlTextNode,
    previousNode?: ParserNode,
    nextNode?: ParserNode
  ) {
    const useIndentation = !(
      previousNode?.type === "edgeMustache" ||
      previousNode?.type === "edgeSafeMustache" ||
      previousNode?.type === "edgeEscapedMustache" ||
      (previousNode?.type === "openingTag" &&
        previousNode.tagName === "textarea")
    );

    const useLineBreak = !(
      nextNode?.type === "edgeMustache" ||
      nextNode?.type === "edgeSafeMustache" ||
      nextNode?.type === "edgeEscapedMustache" ||
      nextNode?.type === "htmlText"
    );

    const skipTrailingWhitespace = /[.,:;!?+\-*/=<>()[\]{}"'@#$%^&*_]/g.test(
      node.value
    );

    return `${this.formatMultilineValue(node.value, this.getIndent(), useIndentation).trimEnd()}${useLineBreak ? "\n" : skipTrailingWhitespace ? "" : " "}`;
  }

  private printLineBreak(
    _node: LineBreakNode,
    previousNode?: ParserNode,
    nextNode?: ParserNode
  ) {
    if (
      (previousNode?.type === "edgeMustache" ||
        previousNode?.type === "edgeEscapedMustache" ||
        previousNode?.type === "edgeSafeMustache" ||
        previousNode?.type === "htmlText" ||
        previousNode?.type === "linebreak") &&
      (nextNode?.type === "edgeMustache" ||
        nextNode?.type === "edgeEscapedMustache" ||
        nextNode?.type === "edgeSafeMustache" ||
        nextNode?.type === "htmlText")
    ) {
      return "\n";
    }

    return "";
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
        return this.printOpeningNode(node);
      case "closingTag":
        return this.printClosingNode(node);
      case "edgeTag":
        return this.printEdgeTagNode(node);
      case "htmlText":
        return this.printHtmlTextNode(node, previousNode, nextNode);
      case "linebreak":
        return this.printLineBreak(node, previousNode, nextNode);
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
