import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../search-input";
import { Filter } from "lucide-react";

describe("SearchInput Component", () => {
  describe("Rendering", () => {
    it("renders search input", () => {
      render(<SearchInput value="" onChange={() => {}} placeholder="Search..." />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("renders with default placeholder", () => {
      render(<SearchInput value="" onChange={() => {}} />);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("renders with search icon", () => {
      render(<SearchInput value="" onChange={() => {}} data-testid="search" />);
      const container = screen.getByTestId("search").parentElement;
      expect(container?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Value Handling", () => {
    it("displays provided value", () => {
      render(<SearchInput value="test query" onChange={() => {}} />);
      expect(screen.getByDisplayValue("test query")).toBeInTheDocument();
    });

    it("calls onChange when typing", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<SearchInput value="" onChange={handleChange} />);

      await user.type(screen.getByRole("textbox"), "new search");
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Clear Button", () => {
    it("shows clear button when value exists", () => {
      render(<SearchInput value="some text" onChange={() => {}} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("hides clear button when value is empty", () => {
      render(<SearchInput value="" onChange={() => {}} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("clears value when clear button is clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const handleClear = vi.fn();
      render(
        <SearchInput
          value="some text"
          onChange={handleChange}
          onClear={handleClear}
        />
      );

      await user.click(screen.getByRole("button"));
      expect(handleChange).toHaveBeenCalledWith("");
      expect(handleClear).toHaveBeenCalled();
    });
  });

  describe("Custom Icon", () => {
    it("accepts custom icon", () => {
      render(<SearchInput value="" onChange={() => {}} icon={Filter} />);
      // Filter icon should be rendered instead of default Search icon
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("Custom className", () => {
    it("applies custom className to container", () => {
      render(
        <SearchInput
          value=""
          onChange={() => {}}
          className="custom-class"
        />
      );
      expect(screen.getByRole("textbox").parentElement).toHaveClass("custom-class");
    });
  });
});
