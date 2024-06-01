import { AstPath, ParserOptions } from "prettier";

type TAdjustLevel = "increase" | "decrease" | "unchanged";

let level = 0;

function getIndent({
  tabWidth,
  levelOverride,
  adjustLevel = "unchanged",
}: {
  tabWidth: number;
  levelOverride?: number;
  adjustLevel?: TAdjustLevel;
}) {
  const value = " ".repeat(
    tabWidth *
      (levelOverride !== undefined && levelOverride <= 0
        ? 0
        : levelOverride || level)
  );

  switch (adjustLevel) {
    case "increase":
      level++;
      break;
    case "decrease":
      level--;
      break;
  }

  return value;
}

export function printWithIndent(node: any, tabWidth: number): string {
  switch (node.type) {
    case "document":
      level = 0;
      return node.children
        .map((child: any) => printWithIndent(child, tabWidth))
        .join("\n");

    case "openingTag":
      const openingAttributes = node.attributes
        .map((attr: any) => `${attr.attributeName}=${attr.attributeValue}`)
        .join(" ");
      return `${getIndent({ tabWidth, adjustLevel: "increase" })}<${node.tagName}${openingAttributes ? " " + openingAttributes : ""}>`;

    case "selfClosingTag":
      const selfClosingAttributes = node.attributes
        .map((attr: any) => `${attr.attributeName}=${attr.attributeValue}`)
        .join(" ");
      return `${getIndent({ tabWidth })}<${node.tagName}${selfClosingAttributes ? " " + selfClosingAttributes : ""} />`;

    case "closingTag":
      return `${getIndent({ tabWidth, adjustLevel: "decrease", levelOverride: level - 1 })}</${node.tagName}>`;

    case "htmlText":
      return node.value
        .split("\n")
        .map((line: string) => `${getIndent({ tabWidth })}${line.trim()}`)
        .join("\n")
        .trimEnd();

    case "scriptlet":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "htmlComment":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "htmlConditionalComment":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "cdata":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "dtd":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "scriptElement":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "styleElement":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "edgeComment":
      return `${getIndent({ tabWidth })}${node.value}`;

    case "edgeMustache":
    case "edgeSafeMustache":
    case "edgeEscapedMustache":
      return `${getIndent({ tabWidth })}${node.value.trim()}`;

    case "edgeTag":
      const value = String(node.value);
      let adjustLevel: TAdjustLevel = "unchanged";
      let levelOverride = level;

      if (value.includes("@end")) {
        adjustLevel = "decrease";
        levelOverride--;
      } else if (value.includes("@else")) {
        levelOverride--;
      } else if (value.includes("@!") || value.includes("@let")) {
        adjustLevel = "unchanged";
      } else {
        adjustLevel = "increase";
      }

      return `${getIndent({ tabWidth, adjustLevel, levelOverride })}${node.value.trim()}`;

    default:
      return "";
  }
}

function print(path: AstPath<any>, options: ParserOptions<any>) {
  const node = path.getNode();
  const { tabWidth } = options;
  return printWithIndent(node, tabWidth);
}

export default print;
