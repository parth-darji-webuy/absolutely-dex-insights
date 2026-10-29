import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountMenu } from "./AccountMenu";
import { AskAiButton } from "./AskAiButton";
import { PaletteProvider } from "./PaletteProvider";

describe("header", () => {
  it("shows Ask AI as a link to the Ask page when the AI is on", () => {
    const m = renderToStaticMarkup(
      <PaletteProvider aiEnabled>
        <AskAiButton />
      </PaletteProvider>,
    );
    expect(m).toContain('href="/ask"');
    expect(m).toContain("Ask AI");
  });

  it("hides Ask AI when the AI is switched off", () => {
    const m = renderToStaticMarkup(
      <PaletteProvider aiEnabled={false}>
        <AskAiButton />
      </PaletteProvider>,
    );
    expect(m).not.toContain("Ask AI");
  });

  it("shows the avatar with the person's initials, and keeps the menu closed until it is clicked", () => {
    const m = renderToStaticMarkup(<AccountMenu name="Designer Exchange" email="designerexchange9@gmail.com" role="Admin" initials="DE" signOut={async () => {}} />);
    expect(m).toContain("DE");
    expect(m).toContain('aria-label="Account menu, Designer Exchange"');
    expect(m).not.toContain("Log out");
  });
});
