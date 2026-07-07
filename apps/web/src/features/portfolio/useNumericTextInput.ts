import { useEffect, useRef, useState } from "react";

type UseNumericTextInputOptions = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
  allowNegative?: boolean;
};

const buildPattern = (decimalPlaces: number, allowNegative: boolean) => {
  const sign = allowNegative ? "-?" : "";
  return decimalPlaces > 0
    ? new RegExp(`^${sign}\\d*(\\.\\d{0,${decimalPlaces}})?$`)
    : new RegExp(`^${sign}\\d*$`);
};

const formatWithCommas = (raw: string) => {
  if (raw === "" || raw === "-") return raw;
  const [intPart, decPart] = raw.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

export const useNumericTextInput = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  decimalPlaces = 0,
  thousandsSeparator = false,
  allowNegative = false,
}: UseNumericTextInputOptions) => {
  const format = (raw: string) =>
    thousandsSeparator ? formatWithCommas(raw) : raw;

  const [text, setText] = useState(() => format(String(value)));
  const isFocused = useRef(false);
  const pattern = buildPattern(decimalPlaces, allowNegative);

  useEffect(() => {
    if (!isFocused.current) {
      setText(format(String(value)));
    }
  }, [value]);

  const handleChange = (rawInput: string) => {
    const raw = thousandsSeparator ? rawInput.replace(/,/g, "") : rawInput;
    if (raw !== "" && !pattern.test(raw)) return;
    if (raw !== "" && raw !== "-" && !raw.endsWith(".") && Number(raw) > max)
      return;
    setText(format(raw));

    const parsed = Number(raw);
    if (raw === "" || raw === "-" || raw.endsWith(".") || Number.isNaN(parsed))
      return;
    onChange(Math.max(min, parsed));
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    setText(format(String(value)));
  };

  return { text, handleChange, handleFocus, handleBlur };
}
