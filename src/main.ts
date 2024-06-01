import { Options, Parser, Printer, SupportLanguage } from "prettier";
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

export const defaultOptions: Options = {};
export const options = {};
