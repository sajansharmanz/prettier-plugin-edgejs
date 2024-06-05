import type { AstPath, ParserOptions } from "prettier";
import type { IndentAdjustment, ParserNode } from "./types";
import {
  addEdgeCommentSpacing,
  addEdgeMustacheSpacing,
  addEdgeSafeMustacheSpacing,
  formatCss,
  formatEdgeValue,
  formatJS,
  printAttribute,
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

  handlePrint(node: ParserNode): string {
    switch (node.type) {
      case "document":
        this.level = 0;
        return node.children
          .map((child: ParserNode) => this.handlePrint(child))
          .join("\n");
      case "dtd":
        this.level = 0;
        return `${this.getIndent()}${node.value}`;
      case "htmlComment":
      case "htmlConditionalComment":
      case "cdata":
      case "scriptlet":
        return `${this.getIndent()}${node.value.trim()}`;
      case "scriptElement":
        return `${formatJS(node, this.tabWidth, this.getIndent(), this.getIndent(this.level + 1))}`;
      case "styleElement":
        return `${formatCss(node, this.getIndent(), this.getIndent(this.level + 1), this.getIndent(1))}`;
      case "edgeComment":
        return `${this.getIndent()}${addEdgeCommentSpacing(node.value.trim())}`;
      case "edgeMustache":
      case "edgeEscapedMustache":
        return `${this.getIndent()}${addEdgeMustacheSpacing(node.value.trim())}`;
      case "edgeSafeMustache":
        return `${this.getIndent()}${addEdgeSafeMustacheSpacing(node.value.trim())}`;
      case "openingTag":
      case "voidTag":
        let attrs = node.attributes
          .map((attr) =>
            attr.attributeValue
              ? `${attr.attributeName}=${addEdgeMustacheSpacing(attr.attributeValue)}`
              : attr.attributeName
          )
          .join(" ");

        let edgeProps = node.edgeProps
          .map((prop) => addEdgeMustacheSpacing(prop.value))
          .join(" ");

        let edgeMustaches = node.edgeMustaches
          .map((mustache) => addEdgeMustacheSpacing(mustache.value))
          .join(" ");

        const combinedLength = `${attrs} ${edgeProps} ${edgeMustaches}`.length;
        const indentation = this.getIndent(this.level + 1);
        const tagIndentation = this.getIndent(
          undefined,
          node.type === "openingTag" ? "increase" : "none"
        );
        const closingIndentation = this.getIndent(this.level - 1);

        if (combinedLength > this.printWidth || this.singleAttributePerLine) {
          attrs = node.attributes
            .map((attr) =>
              attr.attributeValue
                ? `${indentation}${attr.attributeName}=${addEdgeMustacheSpacing(attr.attributeValue)}`
                : `${indentation}${attr.attributeName}`
            )
            .join("\n");

          edgeProps = node.edgeProps
            .map(
              (prop) => `${indentation}${addEdgeMustacheSpacing(prop.value)}`
            )
            .join("\n");

          edgeMustaches = node.edgeMustaches
            .map(
              (mustache) =>
                `${indentation}${addEdgeMustacheSpacing(mustache.value)}`
            )
            .join("\n");

          const closingNewline =
            combinedLength - 2 > 0 ? "\n" + closingIndentation : "";

          return `${tagIndentation}<${node.tagName}${attrs ? "\n" + attrs : ""}${edgeMustaches ? "\n" + edgeMustaches : ""}${edgeProps ? "\n" + edgeProps : ""}${closingNewline}>`;
        }

        return `${tagIndentation}<${node.tagName}${printAttribute(attrs)}${printAttribute(edgeMustaches)}${printAttribute(edgeProps)}>`;
      case "closingTag":
        return `${this.getIndent(this.level - 1, "decrease")}</${node.tagName}>`;
      case "edgeTag":
        const nodeValue = node.value;
        let indentAdjustment: IndentAdjustment = "none";
        let levelOverride = this.level;

        if (nodeValue.includes("@end")) {
          indentAdjustment = "decrease";
          levelOverride--;
        } else if (nodeValue.includes("@else")) {
          levelOverride--;
        } else if (
          nodeValue.includes("@!") ||
          nodeValue.includes("@let") ||
          nodeValue.includes("@vite")
        ) {
          indentAdjustment = "none";
        } else {
          indentAdjustment = "increase";
        }

        return formatEdgeValue(
          node,
          this.getIndent(levelOverride, indentAdjustment)
        );
      case "htmlText":
        return node.value
          .split("\n")
          .map((v) => `${this.getIndent()}${v.trim()}`)
          .join("\n")
          .trimEnd();
      default:
        return "";
    }
  }

  private getIndent(
    levelOverride?: number,
    indentAdjustment: IndentAdjustment = "none"
  ) {
    const value = `${this.useTabs ? "\t" : " "}`.repeat(
      this.tabWidth *
        (levelOverride !== undefined && levelOverride <= 0
          ? 0
          : levelOverride || this.level)
    );

    this.handleIndentAdjustment(indentAdjustment);

    return value;
  }

  private handleIndentAdjustment(indentAdjustment: IndentAdjustment = "none") {
    switch (indentAdjustment) {
      case "increase":
        this.level++;
        break;
      case "decrease":
        this.level--;
        break;
      default:
        break;
    }
  }
}

function print(path: AstPath, options: ParserOptions) {
  const node = path.getNode();

  const printer = new Printer(options);
  return printer.handlePrint(node);
}

export default print;
