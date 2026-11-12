import { useState } from 'react';
import { PRESETS, presetFromUrl, selectPreset } from './rulePresets.js';

// Knapper i lobbyen for å velge regelvariant før Play vs computer
// (eksperiment). Valget lagres i lenken (?regler=...), så det overlever en
// reload og kan deles.
export function RulePicker() {
  const [current, setCurrent] = useState(() => presetFromUrl()?.name ?? null);

  const choose = (name) => {
    selectPreset(name);
    setCurrent(name);
  };

  const options = [
    [null, 'Dagens regler'],
    ...Object.entries(PRESETS).map(([name, p]) => [name, p.label]),
  ];
  const chosen = current ? PRESETS[current] : null;

  return (
    <div className="rule-picker">
      <div className="lobby-divider">Regler mot datamaskinen (test)</div>
      <div className="rule-picker-options" role="radiogroup">
        {options.map(([name, label]) => (
          <button
            key={name ?? 'standard'}
            type="button"
            role="radio"
            aria-checked={current === name}
            className={
              current === name ? 'rule-option selected' : 'rule-option'
            }
            onClick={() => choose(name)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="rule-picker-help">
        {chosen ? chosen.help : 'Spillet slik det er publisert i dag.'}
      </p>
    </div>
  );
}
