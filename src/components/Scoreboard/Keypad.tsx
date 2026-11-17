import { Delete } from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';

type KeypadProps = {
  value: string;
  onChange: (next: string) => void;
};

export function Keypad({ value, onChange }: KeypadProps) {
  const { dict } = useAppStore();

  const press = (digit: string) => {
    if (value.length >= 4) return;
    if (value === '0') {
      onChange(digit);
      return;
    }
    onChange(value + digit);
  };

  const backspace = () => onChange(value.slice(0, -1));
  const clear = () => onChange('');

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  return (
    <div className="keypad" role="group" aria-label={dict.scoreboard.selectAmount}>
      {keys.map((k) => (
        <button key={k} type="button" onClick={() => press(k)}>
          {k}
        </button>
      ))}
      <button
        type="button"
        className="key--action"
        onClick={clear}
        aria-label={dict.keypad.clear}
      >
        C
      </button>
      <button type="button" onClick={() => press('0')}>
        0
      </button>
      <button
        type="button"
        className="key--action"
        onClick={backspace}
        aria-label={dict.keypad.backspace}
      >
        <Delete size={22} aria-hidden />
      </button>
    </div>
  );
}
