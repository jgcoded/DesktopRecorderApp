/* eslint-disable no-unused-vars */
import * as React from 'react';
import './HotKeyInput.scss';

export interface HotKeyInputProps {
  // eslint-disable-next-line no-undef
  hotKey: Electron.Accelerator;
  name: string;
  // eslint-disable-next-line no-undef
  onHotkeySet: (hotkey: Electron.Accelerator) => void;
  onFocus: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export class HotKeyInput extends React.Component<HotKeyInputProps> {
  constructor(props: HotKeyInputProps) {
    super(props);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      return;
    }

    event.preventDefault();

    if (event.getModifierState(event.key as React.ModifierKey)) {
      // early return when only a modifier key is pressed
      return;
    }

    const keys: string[] = [];
    if (event.metaKey) {
      keys.push('Meta');
    }

    if (event.ctrlKey) {
      keys.push('Control');
    }

    if (event.altKey) {
      keys.push('Alt');
    }

    if (event.shiftKey) {
      keys.push('Shift');
    }

    keys.push(event.key);
    const newHotKey = keys.join('+');
    // eslint-disable-next-line react/destructuring-assignment
    this.props.onHotkeySet(newHotKey);
  }

  render() {
    const { name, hotKey, onFocus, onBlur } = this.props;

    const hotKeyString = hotKey.toString();

    let fontAdjustmentClass = '';
    if (hotKeyString.length >= 27) {
      fontAdjustmentClass = 'hotkey-input-smallest';
    } else if (hotKeyString.length > 15) {
      fontAdjustmentClass = 'hotkey-input-small';
    }

    return (
      <input
        id="hotkey-input-control"
        className={`hotkey-input ${fontAdjustmentClass}`}
        type="text"
        name={name}
        onKeyDown={this.onKeyDown}
        value={hotKeyString}
        onFocus={onFocus}
        onBlur={onBlur}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={false}
        readOnly
      />
    );
  }
}
