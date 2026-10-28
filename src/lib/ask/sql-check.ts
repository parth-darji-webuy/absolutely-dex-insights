import { ALLOWED_TABLE_NAMES } from "./schema";

// The lock on the Ask feature. Whatever the AI writes is checked here, on the server, before it runs.
// The database role can only read the allowed tables and the connection is read-only with a timeout;
// this check is a further layer, and it errs on the side of refusing.

export const ROW_LIMIT = 200;

export type SqlCheck = { ok: true; sql: string; limitAdded: boolean } | { ok: false; reason: string };

type Tok = { t: "word" | "quoted" | "string" | "number" | "punct"; v: string; start: number; end: number };

const PUNCT = "(),.;*=<>+-/%:[]|!~?@&^#";

function tokenize(sql: string): Tok[] | string {
  const out: Tok[] = [];
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (/\s/.test(c)) {
      i++;
    } else if ((c === "-" && sql[i + 1] === "-") || (c === "/" && sql[i + 1] === "*")) {
      return "comments are not allowed";
    } else if (c === "'" || c === '"') {
      let j = i + 1;
      let text = "";
      for (;;) {
        if (j >= sql.length) return "unfinished quote";
        if (sql[j] === c) {
          if (sql[j + 1] === c) {
            text += c;
            j += 2;
            continue;
          }
          break;
        }
        text += sql[j++];
      }
      out.push({ t: c === "'" ? "string" : "quoted", v: text, start: i, end: j + 1 });
      i = j + 1;
    } else if (c === "$") {
      return "dollar quoting and parameters are not allowed";
    } else if (c === "\\") {
      return "backslashes are not allowed";
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      const m = /^(\d+(\.\d*)?|\.\d+)/.exec(sql.slice(i))!;
      out.push({ t: "number", v: m[0], start: i, end: i + m[0].length });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(sql.slice(i))!;
      out.push({ t: "word", v: m[0], start: i, end: i + m[0].length });
      i += m[0].length;
    } else if (PUNCT.includes(c)) {
      out.push({ t: "punct", v: c, start: i, end: i + 1 });
      i++;
    } else {
      return "unexpected character";
    }
  }
  return out;
}

// Words that change or lock data, change settings, or read the system. None belongs in a question about the data.
const FORBIDDEN = new Set([
  "insert", "update", "delete", "merge", "drop", "alter", "create", "truncate", "grant", "revoke", "copy", "call", "execute", "prepare", "deallocate",
  "do", "set", "reset", "vacuum", "analyze", "analyse", "cluster", "reindex", "refresh", "begin", "commit", "rollback", "savepoint", "lock",
  "listen", "notify", "unlisten", "into", "returning", "recursive", "information_schema",
]);

// Functions a question can use. Anything else (pg_sleep, set_config, version, file readers...) is refused.
const FUNCTIONS = new Set([
  "count", "sum", "avg", "min", "max", "round", "floor", "ceil", "ceiling", "abs", "coalesce", "nullif", "greatest", "least", "date_trunc", "date_part", "extract",
  "to_char", "now", "timezone", "lower", "upper", "length", "concat", "left", "right", "split_part", "string_agg", "array_agg", "jsonb_array_length", "cast",
  "row_number", "rank", "dense_rank", "lag", "lead", "date", "age", "percentile_cont", "stddev", "variance", "trunc", "mod", "power", "sqrt", "ln", "log",
]);

// Words that can sit in front of "(" without being a function call, and type names used in casts.
const BEFORE_PAREN = new Set([
  "in", "exists", "over", "as", "on", "and", "or", "not", "from", "join", "where", "values", "select", "with", "union", "intersect", "except", "using", "any", "all",
  "filter", "within", "case", "when", "then", "else", "between", "by", "partition", "order", "group", "having", "limit", "offset", "distinct", "lateral", "materialized",
  "numeric", "decimal", "varchar", "char", "timestamp", "timestamptz", "text", "int", "integer", "bigint", "float", "double", "like", "ilike", "is", "interval",
]);

const CLAUSE_END = new Set(["where", "group", "order", "having", "limit", "offset", "union", "intersect", "except", "window", "select"]);

const refuse = (reason: string): SqlCheck => ({ ok: false, reason });

type Frame = { inFrom: boolean; extract: boolean };

/**
 * Checks a query the AI wrote: one statement, SELECT or WITH only, allowed tables and functions only, no system
 * tables, no write words, no comments. Adds LIMIT 200 when missing and lowers a bigger one. Never throws.
 */
export function checkSql(input: unknown): SqlCheck {
  if (typeof input !== "string") return refuse("not text");
  const text = input.trim();
  if (!text) return refuse("empty");
  if (text.length > 4000) return refuse("too long");
  const lexed = tokenize(text);
  if (typeof lexed === "string") return refuse(lexed);
  const toks = [...lexed];

  // One statement: a single semicolon is fine, but only at the very end.
  if (toks.at(-1)?.v === ";" && toks.at(-1)?.t === "punct") toks.pop();
  if (toks.some((t) => t.t === "punct" && t.v === ";")) return refuse("more than one statement");
  if (toks.length === 0) return refuse("empty");

  const first = toks[0];
  if (first.t !== "word" || !["select", "with"].includes(first.v.toLowerCase())) return refuse("only SELECT or WITH");

  // Prefixed strings (E'..', U&'..') can hide characters from this check.
  for (let i = 0; i < toks.length - 1; i++) {
    const a = toks[i];
    const b = toks[i + 1];
    if (a.t === "word" && b.t === "string" && a.end === b.start) return refuse("prefixed strings are not allowed");
    if (a.t === "word" && a.v.toLowerCase() === "u" && b.v === "&") return refuse("prefixed strings are not allowed");
  }

  // Names the query gives to its own WITH parts.
  const ctes = new Set<string>();
  toks.forEach((t, i) => {
    const asTok = toks[i + 1];
    const open = toks[i + 2];
    const open2 = toks[i + 3];
    if (t.t === "word" && asTok?.t === "word" && asTok.v.toLowerCase() === "as" && (open?.v === "(" || (open?.t === "word" && open.v.toLowerCase() === "materialized" && open2?.v === "("))) ctes.add(t.v.toLowerCase());
  });

  const stack: Frame[] = [{ inFrom: false, extract: false }];
  let limitAt = -1;

  const checkFunction = (j: number): string | null => {
    const t = toks[j];
    if (t.t === "quoted") return "quoted function names are not allowed";
    if (toks[j - 1]?.v === ".") return "qualified function names are not allowed";
    return FUNCTIONS.has(t.v.toLowerCase()) ? null : `function ${t.v.toLowerCase()} is not allowed`;
  };

  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    const top = stack[stack.length - 1];
    const lower = tok.v.toLowerCase();

    if (tok.t === "quoted") {
      if (lower.startsWith("pg_") || lower === "information_schema") return refuse("system tables are not allowed");
      if (toks[i + 1]?.v === "(" && toks[i + 1].t === "punct" && !(toks[i - 1]?.t === "word" && ["from", "join"].includes(toks[i - 1].v.toLowerCase()))) return refuse("quoted function names are not allowed");
      continue;
    }
    if (tok.t === "punct") {
      if (tok.v === "(") {
        const prev = toks[i - 1];
        stack.push({ inFrom: false, extract: prev?.t === "word" && prev.v.toLowerCase() === "extract" });
      } else if (tok.v === ")") {
        if (stack.length === 1) return refuse("unbalanced brackets");
        stack.pop();
      } else if (tok.v === "," && top.inFrom && !top.extract) {
        return refuse("list tables with JOIN, not commas");
      }
      continue;
    }
    if (tok.t !== "word") continue;

    if (FORBIDDEN.has(lower)) return refuse(`${lower} is not allowed`);
    if (lower.startsWith("pg_") || lower.startsWith("reg")) return refuse("system functions are not allowed");
    if (lower === "for" && toks[i + 1]?.t === "word" && ["update", "share", "no", "key"].includes(toks[i + 1].v.toLowerCase())) return refuse("locking is not allowed");
    if (CLAUSE_END.has(lower)) top.inFrom = false;
    if (lower === "limit" && stack.length === 1) limitAt = i;

    // A word before "(" is a function call unless it is a keyword or type name.
    const next = toks[i + 1];
    if (next?.t === "punct" && next.v === "(" && !BEFORE_PAREN.has(lower) && !(toks[i - 1]?.t === "word" && ["from", "join"].includes(toks[i - 1].v.toLowerCase()))) {
      const problem = checkFunction(i);
      if (problem) return refuse(problem);
    }

    const isFrom = lower === "from" && !top.extract && !(toks[i - 1]?.t === "word" && toks[i - 1].v.toLowerCase() === "distinct");
    if (isFrom) top.inFrom = true;
    if (isFrom || lower === "join") {
      let j = i + 1;
      while (toks[j]?.t === "word" && ["lateral", "only"].includes(toks[j].v.toLowerCase())) j++;
      const ref = toks[j];
      if (!ref) return refuse("a table is missing");
      if (ref.t === "punct" && ref.v === "(") continue; // a sub-query: its own FROM is checked when we reach it
      if (ref.t !== "word" && ref.t !== "quoted") return refuse("a table is missing");
      // Read schema.table.
      const parts = [ref];
      while (toks[j + 1]?.v === "." && toks[j + 1].t === "punct" && (toks[j + 2]?.t === "word" || toks[j + 2]?.t === "quoted")) {
        parts.push(toks[j + 2]);
        j += 2;
      }
      if (toks[j + 1]?.t === "punct" && toks[j + 1].v === "(") {
        // FROM some_function(...): only allowed functions
        if (parts.length > 1) return refuse("qualified function names are not allowed");
        const problem = checkFunction(j);
        if (problem) return refuse(problem);
        continue;
      }
      if (parts.length > 2) return refuse("table name is not allowed");
      if (parts.length === 2 && parts[0].v.toLowerCase() !== "public") return refuse("only the public schema is allowed");
      const last = parts[parts.length - 1];
      const name = last.t === "quoted" ? last.v : last.v.toLowerCase();
      const isCte = parts.length === 1 && last.t === "word" && ctes.has(name);
      if (!isCte && !ALLOWED_TABLE_NAMES.has(name)) return refuse(`table ${name} is not allowed`);
    }
  }
  if (stack.length !== 1) return refuse("unbalanced brackets");

  // LIMIT: add one, or lower a bigger one.
  let sql = text.replace(/;\s*$/, "").trim();
  if (limitAt === -1) return { ok: true, sql: `${sql} LIMIT ${ROW_LIMIT}`, limitAdded: true };
  const value = toks[limitAt + 1];
  if (value?.t === "number" && /^\d+$/.test(value.v)) {
    if (Number(value.v) > ROW_LIMIT) sql = `${sql.slice(0, value.start)}${ROW_LIMIT}${sql.slice(value.end)}`;
    return { ok: true, sql, limitAdded: false };
  }
  if (value?.t === "word" && value.v.toLowerCase() === "all") {
    sql = `${sql.slice(0, value.start)}${ROW_LIMIT}${sql.slice(value.end)}`;
    return { ok: true, sql, limitAdded: false };
  }
  return refuse("LIMIT must be a number");
}
