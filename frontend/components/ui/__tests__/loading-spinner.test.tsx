import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "../loading-spinner";

describe("LoadingSpinner Component", () => {
  describe("Rendering", () => {
    it("renders loading spinner", () => {
      render(<LoadingSpinner data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("renders with text", () => {
      render(<LoadingSpinner text="Loading data..." />);
      expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("renders small size", () => {
      render(<LoadingSpinner size="sm" data-testid="spinner" />);
      const svg = screen.getByTestId("spinner").querySelector("svg");
      expect(svg).toHaveClass("w-4", "h-4");
    });

    it("renders medium size (default)", () => {
      render(<LoadingSpinner size="md" data-testid="spinner" />);
      const svg = screen.getByTestId("spinner").querySelector("svg");
      expect(svg).toHaveClass("w-6", "h-6");
    });

    it("renders large size", () => {
      render(<LoadingSpinner size="lg" data-testid="spinner" />);
      const svg = screen.getByTestId("spinner").querySelector("svg");
      expect(svg).toHaveClass("w-8", "h-8");
    });

    it("renders xl size", () => {
      render(<LoadingSpinner size="xl" data-testid="spinner" />);
      const svg = screen.getByTestId("spinner").querySelector("svg");
      expect(svg).toHaveClass("w-12", "h-12");
    });
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      render(<LoadingSpinner variant="default" data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toHaveClass("p-8");
    });

    it("renders page variant", () => {
      render(<LoadingSpinner variant="page" data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toHaveClass("min-h-screen");
    });

    it("renders overlay variant", () => {
      render(<LoadingSpinner variant="overlay" data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toHaveClass("absolute", "inset-0");
    });

    it("renders inline variant", () => {
      render(<LoadingSpinner variant="inline" data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toHaveClass("inline-flex");
    });
  });

  describe("Animation", () => {
    it("has spin animation", () => {
      render(<LoadingSpinner data-testid="spinner" />);
      const svg = screen.getByTestId("spinner").querySelector("svg");
      expect(svg).toHaveClass("animate-spin");
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(<LoadingSpinner className="custom-class" data-testid="spinner" />);
      expect(screen.getByTestId("spinner")).toHaveClass("custom-class");
    });
  });
});
