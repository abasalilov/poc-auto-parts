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

interface DropDownMobileProps {
  onChange: (e: SelectChangeEventType, v: string | null) => void;
  options: Option[];
  placeholder: string;
  value: string | null;
  hasError?: boolean;
  disabled?: boolean;
}

export default function DropDownMobile({
  onChange,
  options,
  placeholder,
  value,
  hasError = false,
  disabled = false,
}: DropDownMobileProps) {
  return (
    <Select
      className="w-full md:w-28"
      color={hasError ? "danger" : "neutral"}
      disabled={disabled || options.length === 0}
      onChange={onChange}
      placeholder={placeholder}
      size="md"
      value={value}
      sx={{
        ...(hasError
          ? {
              borderColor: "#dc2626",
              "&:hover": { borderColor: "#dc2626" },
              "&.Mui-focused, &:focus-within": {
                borderColor: "#dc2626",
                boxShadow: "0 0 0 1px #dc2626",
              },
              "&.Mui-disabled": {
                borderColor: "#dc2626",
                color: "#991b1b",
              },
            }
          : {}),
        height: "54px",
        fontSize: "20px",
      }}
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
