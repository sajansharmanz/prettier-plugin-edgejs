export interface BaseNode {
  type: string;
  start: number;
  end: number;
}

export interface DocumentNode extends BaseNode {
  type: "document";
  children: ParserNode[];
}

export interface HtmlTextNode extends BaseNode {
  type: "htmlText";
  value: string;
}

export interface LineBreakNode extends BaseNode {
  type: "linebreak";
  value: string;
}

export interface OpeningTagNode extends BaseNode {
  type: "openingTag";
  tagName: string;
  edgeProps: EdgePropsNode[];
  edgeTagProps: EdgeTagPropsNode[];
  edgeMustaches: EdgeMustacheNode[];
  attributes: AttributeNode[];
  comments: EdgeCommentNode[];
}

export interface VoidTagNode extends BaseNode {
  type: "voidTag";
  tagName: string;
  edgeProps: EdgePropsNode[];
  edgeTagProps: EdgeTagPropsNode[];
  edgeMustaches: EdgeMustacheNode[];
  attributes: AttributeNode[];
  comments: EdgeCommentNode[];
}

export interface ClosingTagNode extends BaseNode {
  type: "closingTag";
  tagName: string;
}

export interface ScriptletNode extends BaseNode {
  type: "scriptlet";
  value: string;
}

export interface HtmlCommentNode extends BaseNode {
  type: "htmlComment";
  value: string;
}

export interface HtmlConditionalCommentNode extends BaseNode {
  type: "htmlConditionalComment";
  value: string;
}

export interface CdataNode extends BaseNode {
  type: "cdata";
  value: string;
}

export interface DtdNode extends BaseNode {
  type: "dtd";
  value: string;
}

export interface ScriptElementNode extends BaseNode {
  type: "scriptElement";
  value: string;
}

export interface StyleElementNode extends BaseNode {
  type: "styleElement";
  value: string;
}

export interface EdgeCommentNode extends BaseNode {
  type: "edgeComment";
  value: string;
}

export interface EdgeMustacheNode extends BaseNode {
  type: "edgeMustache";
  value: string;
}

export interface EdgeSafeMustacheNode extends BaseNode {
  type: "edgeSafeMustache";
  value: string;
}

export interface EdgeEscapedMustacheNode extends BaseNode {
  type: "edgeEscapedMustache";
  value: string;
}

export interface EdgeTagNode extends BaseNode {
  type: "edgeTag";
  value: string;
}

export interface EdgePropsNode extends BaseNode {
  type: "edgeProps";
  value: string;
}

export interface EdgeTagPropsNode extends BaseNode {
  type: "edgeTagProps";
  value: string;
}

export interface AttributeNode extends BaseNode {
  type: "attribute";
  attributeName: string;
  attributeValue?: string;
}

export type ParserNode =
  | DocumentNode
  | HtmlTextNode
  | LineBreakNode
  | OpeningTagNode
  | VoidTagNode
  | ClosingTagNode
  | ScriptletNode
  | HtmlCommentNode
  | HtmlConditionalCommentNode
  | CdataNode
  | DtdNode
  | ScriptElementNode
  | StyleElementNode
  | EdgeCommentNode
  | EdgeMustacheNode
  | EdgeSafeMustacheNode
  | EdgeEscapedMustacheNode
  | EdgeTagNode
  | EdgePropsNode
  | EdgeTagPropsNode
  | AttributeNode;

export type IndentAdjustment = "increase" | "decrease" | "none";
