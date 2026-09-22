/**
 * Audit lean-ishim empties vs ishim-archive.json (no server-only import).
 * Run: node scripts/audit-empty-vs-ishim.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const archive = JSON.parse(
  readFileSync(join(root, "src/data/ishim-archive.json"), "utf8")
);

const people = archive.people || [];
const productions = archive.productions || [];

function personEmpty(p) {
  const notes = (p.general?.length || 0) + (p.trivia?.length || 0);
  const credits = p.credits?.length || 0;
  return {
    noNotes: notes === 0,
    noCredits: credits === 0,
    empty: notes === 0 && credits === 0,
  };
}

function prodEmpty(p) {
  const summary = (p.summary || "").trim();
  const credits = p.credits?.length || 0;
  return {
    noSummary: !summary,
    noCredits: credits === 0,
    empty: !summary && credits === 0,
  };
}

let peopleNoNotes = 0;
let peopleNoCredits = 0;
let peopleBothEmpty = 0;
let peopleFillable = 0; // has notes OR credits
const emptyPeopleSamples = [];

for (const p of people) {
  const e = personEmpty(p);
  if (e.noNotes) peopleNoNotes++;
  if (e.noCredits) peopleNoCredits++;
  if (e.empty) {
    peopleBothEmpty++;
    if (emptyPeopleSamples.length < 8) emptyPeopleSamples.push(p.name);
  } else {
    peopleFillable++;
  }
}

let prodNoSummary = 0;
let prodNoCredits = 0;
let prodBothEmpty = 0;
let prodFillable = 0;
const emptyProdSamples = [];

for (const p of productions) {
  const e = prodEmpty(p);
  if (e.noSummary) prodNoSummary++;
  if (e.noCredits) prodNoCredits++;
  if (e.empty) {
    prodBothEmpty++;
    if (emptyProdSamples.length < 8) emptyProdSamples.push(p.title);
  } else {
    prodFillable++;
  }
}

const withSummary = productions.filter((p) => (p.summary || "").trim()).length;
const withCredits = productions.filter((p) => (p.credits || []).length > 0).length;
const peopleWithContent = people.filter((p) => {
  const e = personEmpty(p);
  return !e.empty;
}).length;

console.log(
  JSON.stringify(
    {
      archivePeople: people.length,
      archiveProductions: productions.length,
      people: {
        withNotesOrCredits: peopleWithContent,
        noNotes: peopleNoNotes,
        noCredits: peopleNoCredits,
        bothEmpty: peopleBothEmpty,
        fillableFromArchive: peopleFillable,
        emptySamples: emptyPeopleSamples,
      },
      productions: {
        withSummary,
        withCredits,
        noSummary: prodNoSummary,
        noCredits: prodNoCredits,
        bothEmpty: prodBothEmpty,
        fillableFromArchive: prodFillable,
        emptySamples: emptyProdSamples,
      },
    },
    null,
    2
  )
);
