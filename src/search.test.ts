import { describe, it, expect } from "vitest";

/**
 * These tests verify that the obsidian_search escaping pattern
 * (JSON.stringify) prevents JavaScript injection through search queries.
 *
 * The search tool builds code like:
 *   ((q) => ...filter(f => f.path.includes(q))...)(JSON.stringify(query))
 *
 * We test that JSON.stringify produces safe output for all edge cases.
 */

/** Simulate the exact code construction from vault.ts obsidian_search */
function buildSearchCode(query: string): string {
  const safe = JSON.stringify(query);
  return `((q) => app.vault.getMarkdownFiles().filter(f => f.path.includes(q) || f.basename.includes(q)).map(f => f.path).join('\\n'))(${safe})`;
}

describe("obsidian_search input escaping", () => {
  it("wraps query in JSON-safe double quotes", () => {
    const code = buildSearchCode("test");
    expect(code).toContain(')("test")');
  });

  it("escapes single quotes safely", () => {
    const code = buildSearchCode("it's a test");
    // JSON.stringify preserves single quotes as-is inside double quotes
    expect(code).toContain(')("it\'s a test")');
  });

  it("escapes double quotes", () => {
    const code = buildSearchCode('say "hello"');
    expect(code).toContain('("say \\"hello\\"")');
  });

  it("escapes backslashes", () => {
    const code = buildSearchCode("path\\to\\file");
    expect(code).toContain('("path\\\\to\\\\file")');
  });

  it("escapes newlines", () => {
    const code = buildSearchCode("line1\nline2");
    expect(code).toContain('("line1\\nline2")');
    // No literal newline in the generated code
    expect(code.split("\n")).toHaveLength(1);
  });

  it("prevents template literal injection", () => {
    const code = buildSearchCode("${process.exit(1)}");
    // JSON.stringify does not interpret template literals — they're just characters
    // The result is a regular string, not a template literal
    expect(code).not.toContain("`");
    expect(code).toContain("${process.exit(1)}");
  });

  it("prevents quote-breaking injection via backslash", () => {
    // Old code used: '${query.replace(/'/g, "\\'")}'
    // Attack: a backslash before a quote undoes the escaping in the old code
    // Input with literal backslash + quote: \'
    const malicious = "\\' + process.exit(1) + \\'";
    const code = buildSearchCode(malicious);
    // JSON.stringify escapes the backslashes, keeping everything as a string
    expect(code).toContain("\\\\");
    // The code should be syntactically valid JS (string literal, not code)
    expect(() => new Function(code)).not.toThrow();
  });

  it("handles empty string", () => {
    const code = buildSearchCode("");
    expect(code).toContain('("")');
  });

  it("handles unicode", () => {
    const code = buildSearchCode("日本語テスト");
    expect(code).toContain('("日本語テスト")');
  });

  it("uses IIFE pattern to scope the query variable", () => {
    const code = buildSearchCode("test");
    expect(code).toMatch(/^\(\(q\) =>/);
    expect(code).toMatch(/\)\("test"\)$/);
  });
});

describe("old escaping was vulnerable", () => {
  /** Simulate the OLD (vulnerable) code from vault.ts */
  function buildOldSearchCode(query: string): string {
    return `app.vault.getMarkdownFiles().filter(f => f.path.includes('${query.replace(/'/g, "\\'")}') || f.basename.includes('${query.replace(/'/g, "\\'")}')).map(f => f.path).join('\\n')`;
  }

  it("backslash-quote injection breaks old escaping", () => {
    // A backslash before a quote undoes the old single-quote escaping.
    // Input: \' + evil + \'
    // Old replace turns ' into \', so \' becomes \\'
    // In JS: \\' = escaped backslash + string-ending quote → injection!
    const malicious = "\\' + process.exit(1) + \\'";
    const oldCode = buildOldSearchCode(malicious);
    // The old code contains \\' which in JS ends the string after a literal backslash
    expect(oldCode).toContain("\\\\'");

    // New code safely wraps the whole thing in JSON.stringify
    const newCode = buildSearchCode(malicious);
    // The code is syntactically valid — malicious input stays as string data
    expect(() => new Function(newCode)).not.toThrow();
  });
});
