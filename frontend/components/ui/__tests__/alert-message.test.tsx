import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertMessage } from "../alert-message";

describe("AlertMessage Component", () => {
  describe("Rendering", () => {
    it("renders alert message", () => {
      render(<AlertMessage type="info" message="This is an info message" />);
      expect(screen.getByText("This is an info message")).toBeInTheDocument();
    });

    it("renders with title", () => {
      render(<AlertMessage type="success" title="Success!" message="Operation completed" />);
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByText("Operation completed")).toBeInTheDocument();
    });
  });

  describe("Alert Types", () => {
    it("renders success type", () => {
      render(<AlertMessage type="success" message="Success" data-testid="alert" />);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-emerald-50", "border-emerald-200");
    });

    it("renders error type", () => {
      render(<AlertMessage type="error" message="Error" data-testid="alert" />);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-red-50", "border-red-200");
    });

    it("renders warning type", () => {
      render(<AlertMessage type="warning" message="Warning" data-testid="alert" />);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-amber-50", "border-amber-200");
    });

    it("renders info type", () => {
      render(<AlertMessage type="info" message="Info" data-testid="alert" />);
      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-blue-50", "border-blue-200");
    });
  });

  describe("Accessibility", () => {
    it("has alert role", () => {
      render(<AlertMessage type="error" message="Error message" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Dismiss Functionality", () => {
    it("shows dismiss button when dismissible", () => {
      render(
        <AlertMessage
          type="info"
          message="Dismissible message"
          dismissible
          onDismiss={() => {}}
        />
      );
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("does not show dismiss button when not dismissible", () => {
      render(<AlertMessage type="info" message="Non-dismissible message" />);
      expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();
      render(
        <AlertMessage
          type="warning"
          message="Dismissible"
          dismissible
          onDismiss={handleDismiss}
        />
      );

      await user.click(screen.getByRole("button", { name: /dismiss/i }));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("Icon Display", () => {
    it("displays appropriate icon for each type", () => {
      render(<AlertMessage type="success" message="Success" data-testid="alert" />);
      const alert = screen.getByTestId("alert");
      expect(alert.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(
        <AlertMessage
          type="info"
          message="Custom class"
          className="custom-class"
          data-testid="alert"
        />
      );
      expect(screen.getByTestId("alert")).toHaveClass("custom-class");
    });
  });
});
