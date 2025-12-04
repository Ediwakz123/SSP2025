import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../empty-state";

describe("EmptyState Component", () => {
  describe("Rendering", () => {
    it("renders empty state with title", () => {
      render(<EmptyState title="No data found" />);
      expect(screen.getByText("No data found")).toBeInTheDocument();
    });

    it("renders with description", () => {
      render(<EmptyState title="Empty" description="Try adding some items" />);
      expect(screen.getByText("Empty")).toBeInTheDocument();
      expect(screen.getByText("Try adding some items")).toBeInTheDocument();
    });

    it("renders default icon when no custom icon provided", () => {
      render(<EmptyState title="No data" data-testid="empty" />);
      const container = screen.getByTestId("empty");
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders custom icon", () => {
      const CustomIcon = <span data-testid="custom-icon">📭</span>;
      render(<EmptyState title="No data" icon={CustomIcon} />);
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders default variant", () => {
      render(<EmptyState title="Empty" data-testid="empty" />);
      expect(screen.getByTestId("empty")).toHaveClass("py-16");
    });

    it("renders compact variant", () => {
      render(<EmptyState title="Empty" variant="compact" data-testid="empty" />);
      expect(screen.getByTestId("empty")).toHaveClass("py-8");
    });

    it("renders card variant", () => {
      render(<EmptyState title="Empty" variant="card" />);
      // Card variant wraps content in a Card component
      expect(screen.getByText("Empty")).toBeInTheDocument();
    });
  });

  describe("Action Button", () => {
    it("renders action button when provided", () => {
      render(
        <EmptyState
          title="No items"
          action={{
            label: "Add Item",
            onClick: () => {},
          }}
        />
      );
      expect(screen.getByRole("button", { name: "Add Item" })).toBeInTheDocument();
    });

    it("calls onClick when action button is clicked", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <EmptyState
          title="No items"
          action={{
            label: "Add Item",
            onClick: handleClick,
          }}
        />
      );

      await user.click(screen.getByRole("button", { name: "Add Item" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not render action button when not provided", () => {
      render(<EmptyState title="No data" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className", () => {
      render(
        <EmptyState
          title="Empty"
          className="custom-class"
          data-testid="empty"
        />
      );
      expect(screen.getByTestId("empty")).toHaveClass("custom-class");
    });
  });
});
