"use client";

import { useState } from "react";
import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Button } from "@base-ui/react/button";

interface MarketInputProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
}

export function MarketInput({ onSubmit, loading = false }: MarketInputProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <Form
      className="flex w-full flex-col gap-4"
      errors={errors}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const url = formData.get("url") as string;

        if (!url) {
          setErrors({ url: "URLを入力してください" });
          return;
        }

        if (!url.includes("polymarket.com")) {
          setErrors({ url: "PolymarketのURLを入力してください" });
          return;
        }

        setErrors({});
        onSubmit(url);
      }}
    >
      <Field.Root name="url" className="flex flex-col items-start gap-1">
        <Field.Label className="text-sm font-medium text-gray-900">
          Polymarket市場URL
        </Field.Label>
        <Field.Control
          type="url"
          required
          placeholder="https://polymarket.com/event/..."
          className="h-10 w-full rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
        />
        <Field.Error className="text-sm text-red-800" />
      </Field.Root>
      <Button
        type="submit"
        disabled={loading}
        focusableWhenDisabled
        className="flex items-center justify-center h-10 px-3.5 m-0 outline-0 border border-gray-200 rounded-md bg-blue-600 text-white font-inherit text-base font-medium leading-6 select-none hover:bg-blue-700 active:data-disabled:bg-disabled-gray active:bg-blue-800 focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-disabled:text-gray-400 data-disabled:bg-gray-300 cursor-pointer hover:data-disabled:bg-disabled-gray"
      >
        {loading ? "分析中..." : "分析開始"}
      </Button>
    </Form>
  );
}
