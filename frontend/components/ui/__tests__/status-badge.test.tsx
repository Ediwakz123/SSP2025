import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";

describe("StatusBadge Component", () => {
  describe("Rendering", () => {
    it("renders status badge with text", () => {
      render(<StatusBadge status="success" text="Active" />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("renders status badge with children", () => {
      render(<StatusBadge status="info">Pending</StatusBadge>);
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  describe("Status Types", () => {
    it("renders success status", () => {
      render(<StatusBadge status="success" text="Success" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-emerald-50", "text-emerald-600");
    });

    it("renders error status", () => {
      render(<StatusBadge status="error" text="Error" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-red-50", "text-red-600");
    });

    it("renders warning status", () => {
      render(<StatusBadge status="warning" text="Warning" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-amber-50", "text-amber-600");
    });

    it("renders info status", () => {
      render(<StatusBadge status="info" text="Info" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-blue-50", "text-blue-600");
    });

    it("renders neutral status", () => {
      render(<StatusBadge status="neutral" text="Neutral" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-gray-50", "text-gray-600");
    });
  });

  describe("Sizes", () => {
    it("renders small size", () => {
      render(<StatusBadge status="success" text="Small" size="sm" data-testid="badge" />);
      expect(screen.getByTestId("badge")).toHaveClass("text-xs");
    });

    it("renders medium size (default)", () => {
      render(<StatusBadge status="success" text="Medium" size="md" data-testid="badge" />);
      expect(screen.getByTestId("badge")).toHaveClass("text-sm");
    });

    it("renders large size", () => {
      render(<StatusBadge status="success" text="Large" size="lg" data-testid="badge" />);
      expect(screen.getByTestId("badge")).toHaveClass("text-base");
    });
  });

  describe("Icon Visibility", () => {
    it("shows icon by default", () => {
      render(<StatusBadge status="success" text="With Icon" data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge.querySelector("svg")).toBeInTheDocument();
    });

    it("hides icon when showIcon is false", () => {
      render(<StatusBadge status="success" text="No Icon" showIcon={false} data-testid="badge" />);
      const badge = screen.getByTestId("badge");
      expect(badge.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(<StatusBadge status="success" text="Custom" className="custom-class" data-testid="badge" />);
      expect(screen.getByTestId("badge")).toHaveClass("custom-class");
    });
  });
});
