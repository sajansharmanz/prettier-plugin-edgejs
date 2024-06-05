import type {
  Options,
  Parser,
  Printer,
  SupportLanguage,
  SupportOptions,
} from "prettier";
import edgeParser from "edgejs-parser";

import print from "./print";

export const languages: Array<SupportLanguage> = [
  {
    name: "EdgeJS",
    parsers: ["edgejs"],
    extensions: [".edge"],
    tmScope: "text.html.edge",
    aceMode: "html",
    linguistLanguageId: 460509620,
    vscodeLanguageIds: ["edge"],
  },
];

export const parsers: { [key: string]: Parser } = {
  edgejs: {
    parse(text) {
      return edgeParser(text);
    },
    astFormat: "edgejs",
    locStart(node) {
      return node.start;
    },
    locEnd(node) {
      return node.end;
    },
  },
};

export const printers: { [key: string]: Printer } = {
  edgejs: {
    print,
  },
};

export const defaultOptions: Options = {
  useTabs: false,
  tabWidth: 4,
  printWidth: 80,
  singleAttributePerLine: false,
};

export const options: SupportOptions = {};
