import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChatInput } from "@/components/ChatInput";

function setup(disabled = false) {
  const onSend = vi.fn();
  render(<ChatInput onSend={onSend} disabled={disabled} />);
  return { onSend, input: screen.getByLabelText("Your question"), button: screen.getByRole("button", { name: "Send" }) };
}

describe("ChatInput", () => {
  it("sends the trimmed message on Enter and clears the input", async () => {
    const { onSend, input } = setup();

    await userEvent.type(input, "  What is LINQ?  {Enter}");

    expect(onSend).toHaveBeenCalledWith("What is LINQ?");
    expect(input).toHaveValue("");
  });

  it("adds a new line on Shift+Enter instead of sending", async () => {
    const { onSend, input } = setup();

    await userEvent.type(input, "line one{Shift>}{Enter}{/Shift}line two");

    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue("line one\nline two");
  });

  it("sends when the button is clicked", async () => {
    const { onSend, input, button } = setup();

    await userEvent.type(input, "Hello");
    await userEvent.click(button);

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("does not send empty or whitespace-only input", async () => {
    const { onSend, input, button } = setup();

    expect(button).toBeDisabled();
    await userEvent.type(input, "   {Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it("does not send while disabled", async () => {
    const { onSend, input, button } = setup(true);

    await userEvent.type(input, "Hello{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
