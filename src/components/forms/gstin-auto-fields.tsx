"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormField, FormSelect } from "@/components/forms/form-fields";
import { INDIAN_STATES } from "@/lib/constants/india";
import { normalizeGstin, parseGstinAutoFill } from "@/lib/gst";

type GstinAutoFieldsProps = {
  defaultGstin?: string;
  defaultState?: string;
  defaultPan?: string;
  gstinRequired?: boolean;
  showPanField?: boolean;
  panFieldId?: string;
};

function initialFromGstin(
  defaultGstin: string,
  defaultState: string,
  defaultPan: string,
  showPanField: boolean,
) {
  if (defaultGstin.length < 2) {
    return { state: defaultState, pan: defaultPan, hint: null as string | null };
  }
  const parsed = parseGstinAutoFill(defaultGstin);
  return {
    state: parsed.state ?? defaultState,
    pan: showPanField ? (parsed.pan ?? defaultPan) : defaultPan,
    hint: parsed.hint,
  };
}

export function GstinAutoFields({
  defaultGstin = "",
  defaultState = "",
  defaultPan = "",
  gstinRequired = false,
  showPanField = true,
  panFieldId = "pan",
}: GstinAutoFieldsProps) {
  const initial = initialFromGstin(defaultGstin, defaultState, defaultPan, showPanField);
  const gstinInputRef = useRef<HTMLInputElement>(null);

  const [gstin, setGstin] = useState(defaultGstin);
  const [state, setState] = useState(initial.state);
  const [pan, setPan] = useState(initial.pan);
  const [hint, setHint] = useState<string | null>(
    defaultGstin.length >= 2 ? initial.hint : null,
  );

  const applyGstin = useCallback(
    (raw: string) => {
      const next = normalizeGstin(raw);
      setGstin(next);

      const parsed = parseGstinAutoFill(next);

      if (parsed.state) {
        setState(parsed.state);
      }
      if (showPanField && parsed.pan) {
        setPan(parsed.pan);
      }
      setHint(parsed.hint);
    },
    [showPanField],
  );

  /** Chrome fills fields without firing React onChange — read the DOM value. */
  const syncFromDom = useCallback(() => {
    const domValue = gstinInputRef.current?.value ?? "";
    if (domValue && domValue !== gstin) {
      applyGstin(domValue);
    }
  }, [applyGstin, gstin]);

  useEffect(() => {
    syncFromDom();
    const timers = [100, 300, 600, 1200].map((ms) =>
      window.setTimeout(syncFromDom, ms),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [syncFromDom]);

  return (
    <>
      {/* Hidden fields hold real values for form submit — browser won't autofill these */}
      <input type="hidden" name="gstin" value={gstin} readOnly />
      <input type="hidden" name="state" value={state} readOnly />
      {showPanField && (
        <input type="hidden" name={panFieldId} value={pan} readOnly />
      )}

      <FormField
        label="GSTIN (GST Number)"
        id="company-gstin"
        placeholder="27AABCS1429B1Z5"
        hint={
          hint ??
          "Type GSTIN — State fills after 2 digits, PAN after 12 (India GST rules)"
        }
        maxLength={15}
        required={gstinRequired}
        value={gstin}
        ref={gstinInputRef}
        onChange={(e) => applyGstin(e.target.value)}
        onInput={(e) => applyGstin(e.currentTarget.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          window.setTimeout(() => applyGstin(pasted || e.currentTarget.value), 0);
        }}
        onFocus={syncFromDom}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        className="sm:col-span-2"
        style={{ textTransform: "uppercase" }}
      />

      <FormSelect
        label="State"
        id="company-state"
        name=""
        placeholder="Select state"
        value={state}
        onChange={(e) => setState(e.target.value)}
        hint="Auto-filled from first 2 digits of GSTIN"
        autoComplete="off"
        options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
      />

      {showPanField && (
        <FormField
          label="PAN"
          id="company-pan"
          placeholder="ABCDE1234F"
          hint="Auto-filled from GSTIN characters 3–12"
          maxLength={10}
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase())}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          style={{ textTransform: "uppercase" }}
        />
      )}
    </>
  );
}
