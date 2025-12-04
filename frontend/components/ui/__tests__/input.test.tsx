import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../input";

describe("Input Component", () => {
  describe("Rendering", () => {
    it("renders input element", () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with correct type", () => {
      render(<Input type="email" data-testid="email-input" />);
      expect(screen.getByTestId("email-input")).toHaveAttribute("type", "email");
    });

    it("defaults to text input when type not specified", () => {
      render(<Input data-testid="text-input" />);
      const input = screen.getByTestId("text-input");
      // Input without type attribute defaults to text in HTML
      expect(input.getAttribute("type")).toBeNull();
    });
  });

  describe("Error State", () => {
    it("applies error styles when error is true", () => {
      render(<Input error data-testid="error-input" />);
      const input = screen.getByTestId("error-input");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("does not have aria-invalid when no error", () => {
      render(<Input data-testid="no-error-input" />);
      const input = screen.getByTestId("no-error-input");
      expect(input).not.toHaveAttribute("aria-invalid");
    });
  });

  describe("Icon Support", () => {
    it("renders with left icon", () => {
      const Icon = () => <span data-testid="left-icon">🔍</span>;
      render(<Input icon={<Icon />} iconPosition="left" />);
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("renders with right icon", () => {
      const Icon = () => <span data-testid="right-icon">✓</span>;
      render(<Input icon={<Icon />} iconPosition="right" />);
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("is disabled when disabled prop is true", () => {
      render(<Input disabled data-testid="disabled-input" />);
      expect(screen.getByTestId("disabled-input")).toBeDisabled();
    });
  });

  describe("Interactions", () => {
    it("accepts user input", async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      
      const input = screen.getByTestId("input");
      await user.type(input, "Hello World");
      
      expect(input).toHaveValue("Hello World");
    });

    it("calls onChange when typing", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      
      await user.type(screen.getByTestId("input"), "test");
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(<Input className="custom-class" data-testid="custom-input" />);
      expect(screen.getByTestId("custom-input")).toHaveClass("custom-class");
    });
  });
});
