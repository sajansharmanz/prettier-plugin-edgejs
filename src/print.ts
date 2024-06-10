import type { AstPath, ParserOptions } from "prettier";
import type { IndentAdjustment, ParserNode } from "./types";
import {
  addEdgeCommentSpacing,
  addEdgeMustacheSpacing,
  addEdgeSafeMustacheSpacing,
  countLeadingSpaces,
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

  handlePrint(
    node: ParserNode,
    previousNode: ParserNode | undefined,
    nextNode: ParserNode | undefined
  ): string {
    switch (node.type) {
      case "document":
        this.level = 0;
        return node.children
          .map((child: ParserNode, index) =>
            this.handlePrint(
              child,
              node.children[index - 1],
              node.children[index + 1]
            )
          )
          .join("");
      case "dtd":
        this.level = 0;
        return `${this.getIndent()}${node.value}\n`;
      case "htmlComment":
      case "htmlConditionalComment":
      case "cdata":
      case "scriptlet":
        return `${this.getIndent()}${node.value.trim()}\n`;
      case "scriptElement":
        return `${formatJS(node, this.tabWidth, this.getIndent(), this.getIndent(this.level + 1))}\n`;
      case "styleElement":
        return `${formatCss(node, this.getIndent(), this.getIndent(this.level + 1), this.getIndent(1))}\n`;
      case "edgeComment":
        return `${this.getIndent()}${addEdgeCommentSpacing(node.value.trim())}\n`;
      case "edgeMustache":
      case "edgeEscapedMustache":
        let useIndentation = true;
        let useLineBreak = true;
        const noSpaceAtEnd =
          nextNode &&
          nextNode.type === "htmlText" &&
          /^[.,!?:;"'(){}[\]<>%$€£°#&@]/.test(nextNode.value.charAt(0));

        if (
          previousNode?.type === "htmlText" ||
          previousNode?.type === "edgeMustache" ||
          previousNode?.type === "edgeEscapedMustache"
        ) {
          useIndentation = false;
        }

        if (
          nextNode?.type === "htmlText" ||
          nextNode?.type === "edgeMustache" ||
          nextNode?.type === "edgeEscapedMustache"
        ) {
          useLineBreak = false;
        }

        return `${useIndentation ? this.getIndent() : ""}${addEdgeMustacheSpacing(node.value)}${useLineBreak ? "\n" : noSpaceAtEnd ? "" : " "}`;
      case "edgeSafeMustache":
        return `${this.getIndent()}${addEdgeSafeMustacheSpacing(node.value.trim())}\n`;
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

        let edgeTagProps = node.edgeTagProps
          .map((prop) => prop.value)
          .join(" ");

        let edgeMustaches = node.edgeMustaches
          .map((mustache) => addEdgeMustacheSpacing(mustache.value))
          .join(" ");

        let comments = node.comments.map((comment) => comment.value).join(" ");

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

          edgeTagProps = node.edgeTagProps
            .map((prop) => `${indentation}${prop.value}`)
            .join("\n");

          edgeMustaches = node.edgeMustaches
            .map(
              (mustache) =>
                `${indentation}${addEdgeMustacheSpacing(mustache.value)}`
            )
            .join("\n");

          comments = node.comments
            .map((comment) => `${indentation}${comment.value}`)
            .join("\n");

          const closingNewline =
            combinedLength - 2 > 0 ? "\n" + closingIndentation : "";

          return `${tagIndentation}<${node.tagName}${attrs ? "\n" + attrs : ""}${edgeMustaches ? "\n" + edgeMustaches : ""}${edgeProps ? "\n" + edgeProps : ""}${
            edgeTagProps
              ? "\n" +
                edgeTagProps
                  .split("\n")
                  .map((value, index) => {
                    if (
                      index === 0 ||
                      index === edgeTagProps.split("\n").length - 1
                    ) {
                      return `${indentation}${value.trim()}`;
                    }

                    const originalWhitespace = countLeadingSpaces(value);

                    return `${" ".repeat(Math.max(indentation.length, originalWhitespace))}${value.trim()}`;
                  })
                  .join("\n")
              : ""
          }${
            comments
              ? "\n" +
                comments
                  .split("\n")
                  .map((value, index) => {
                    if (
                      index === 0 ||
                      index === comments.split("\n").length - 1
                    ) {
                      return `${indentation}${value.trim()}`;
                    }

                    const originalWhitespace = countLeadingSpaces(value);

                    return `${" ".repeat(Math.max(indentation.length, originalWhitespace))}${value.trim()}`;
                  })
                  .join("\n")
              : ""
          }${closingNewline}>\n`;
        }

        return `${tagIndentation}<${node.tagName}${printAttribute(attrs)}${printAttribute(edgeMustaches)}${printAttribute(edgeProps)}${printAttribute(
          edgeTagProps
            .split("\n")
            .map((value, index) => {
              if (
                index === 0 ||
                index === edgeTagProps.split("\n").length - 1
              ) {
                return `${value}`;
              }

              const originalWhitespace = countLeadingSpaces(value);

              return `${" ".repeat(Math.max(indentation.length, originalWhitespace))}${value.trim()}`;
            })
            .join("\n")
        )}${printAttribute(
          comments
            .split("\n")
            .map((value, index) => {
              if (index === 0 || index === comments.split("\n").length - 1) {
                return `${value}`;
              }

              const originalWhitespace = countLeadingSpaces(value);

              return `${" ".repeat(Math.max(indentation.length, originalWhitespace))}${value.trim()}`;
            })
            .join("\n")
        )}>\n`;
      case "closingTag":
        return `${this.getIndent(this.level - 1, "decrease")}</${node.tagName}>\n`;
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
          nodeValue.includes("@vite") ||
          nodeValue.match(/^@include\(.*/)?.length ||
          nodeValue.match(/^@includeIf\(.*/)?.length ||
          !nodeValue.includes("(")
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
        let useIndentation2 = true;
        let useLineBreak2 = true;

        if (
          previousNode?.type === "edgeMustache" ||
          previousNode?.type === "edgeSafeMustache"
        ) {
          useIndentation2 = false;
        }

        if (
          nextNode?.type === "edgeMustache" ||
          nextNode?.type === "edgeSafeMustache" ||
          nextNode?.type === "htmlText"
        ) {
          useLineBreak2 = false;
        }

        return `${node.value
          .split("\n")
          .map((value, index) => {
            if (index === 0) {
              return `${useIndentation2 ? this.getIndent() : ""}${value}`;
            }

            return `${this.getIndent()}${value.trim()}`;
          })
          .join("\n")
          .trimEnd()}${useLineBreak2 ? "\n" : " "}`;

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
  return printer.handlePrint(node, undefined, undefined);
}

export default print;
