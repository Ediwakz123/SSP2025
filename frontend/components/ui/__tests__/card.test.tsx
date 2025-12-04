import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders card with children", () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("renders default variant", () => {
      render(<Card data-testid="card">Default</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-card");
    });

    it("renders elevated variant", () => {
      render(<Card variant="elevated" data-testid="card">Elevated</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("shadow-lg");
    });

    it("renders glass variant", () => {
      render(<Card variant="glass" data-testid="card">Glass</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("backdrop-blur-xl");
    });

    it("renders interactive variant", () => {
      render(<Card variant="interactive" data-testid="card">Interactive</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("applies custom className", () => {
      render(<Card className="custom-class" data-testid="card">Custom</Card>);
      expect(screen.getByTestId("card")).toHaveClass("custom-class");
    });
  });

  describe("CardHeader", () => {
    it("renders card header", () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("applies correct slot attribute", () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header");
    });
  });

  describe("CardTitle", () => {
    it("renders card title", () => {
      render(<CardTitle>My Title</CardTitle>);
      expect(screen.getByText("My Title")).toBeInTheDocument();
    });

    it("applies correct slot attribute", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId("title")).toHaveAttribute("data-slot", "card-title");
    });

    it("renders as h4 element", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText("Title").tagName).toBe("H4");
    });
  });

  describe("CardDescription", () => {
    it("renders card description", () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("applies muted text styles", () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveClass("text-muted-foreground");
    });
  });

  describe("CardContent", () => {
    it("renders card content", () => {
      render(<CardContent>Content goes here</CardContent>);
      expect(screen.getByText("Content goes here")).toBeInTheDocument();
    });

    it("applies correct slot attribute", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "card-content");
    });
  });

  describe("CardFooter", () => {
    it("renders card footer", () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("applies flex layout", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveClass("flex");
    });
  });

  describe("Full Card Composition", () => {
    it("renders complete card with all sections", () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Card Content")).toBeInTheDocument();
      expect(screen.getByText("Card Footer")).toBeInTheDocument();
    });
  });
});
