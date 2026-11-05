"use client";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import ListDivider from "@mui/joy/ListDivider";

interface Option {
  value: string;
  label: string;
  isDivider?: boolean;
}
export type SelectChangeEventType =
  | React.MouseEvent<Element, MouseEvent>
  | React.KeyboardEvent<Element>
  | React.FocusEvent<Element, Element>
  | null;

interface DropDownProps {
  onChange: (e: SelectChangeEventType, v: string | null) => void;
  options: Option[];
  placeholder: string;
  value: string | null;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function DropDown({
  onChange,
  options,
  placeholder,
  value,
  disabled = false,
  loading = false,
  label,
  size = "sm",
}: DropDownProps) {
  return (
    <Select
      className="w-full"
      disabled={disabled || loading || (options.length === 0 && !value)}
      onChange={onChange}
      placeholder={placeholder}
      size={size}
      value={value}
      slotProps={label ? { button: { "aria-label": label } } : undefined}
    >
      {options.map((opt: Option, i: number) => {
        if (opt.isDivider) {
          return <ListDivider key={`divider-${i}`} />;
        }
        return (
          <Option
            className="font-mont"
            key={opt.value}
            value={opt.value}
          >
            {opt.label.replace("&amp;", "&")}
          </Option>
        );
      })}
    </Select>
  );
}
