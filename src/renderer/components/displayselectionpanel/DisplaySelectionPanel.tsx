import * as React from 'react';
import SVG from 'react-inlinesvg';
import { Monitor, IsSupportedMonitor } from '../../../common/RecordableDevices';

import './DisplaySelectionPanel.scss';
import DisplaySVGPath from '../../../../assets/display.svg';
import CheckedCircleSvgPath from '../../../../assets/checkedcircle.svg';

export interface DisplaySelectionPanelProps {
  displays: Monitor[];
  currentDisplay: number;
  selectionDisabled: boolean;
  // eslint-disable-next-line no-unused-vars
  onDisplaySelected: (display: Monitor) => void;
}

// eslint-disable-next-line react/prefer-stateless-function
export class DisplaySelectionPanel extends React.Component<DisplaySelectionPanelProps> {
  render() {
    const { displays, currentDisplay, selectionDisabled, onDisplaySelected } =
      this.props;
    // eslint-disable-next-line no-undef
    const displayItems: JSX.Element[] = displays.map((display) => {
      const isMonitorSupported = IsSupportedMonitor(display);
      const isCurrentDisplay =
        isMonitorSupported && display.index === currentDisplay;
      let className = isCurrentDisplay ? 'selected-list-item' : '';
      className += !isMonitorSupported ? ' unsupported-rotation' : '';
      className += selectionDisabled ? ' selection-disabled' : '';
      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <li
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          key={`${display.name} ${display.adapter}`}
          title={`${display.name} ${display.adapter}`}
          onClick={() =>
            !selectionDisabled &&
            isMonitorSupported &&
            onDisplaySelected(display)
          }
          className={className}
          value={display.index}
        >
          <SVG className="list-item-icon" src={DisplaySVGPath} />
          <div className="list-item-info">
            <div className="list-item-name">{display.name}</div>
            <p>{display.adapter}</p>
            {!isMonitorSupported && (
              <p className="error-text">Rotation Not Supported</p>
            )}
          </div>
          {isCurrentDisplay && (
            <SVG className="checkmark-icon" src={CheckedCircleSvgPath} />
          )}
        </li>
      );
    });

    return (
      <div className="display-selection-panel">
        {displayItems.length === 0 && <span>No screens found</span>}
        <ul>{displayItems}</ul>
      </div>
    );
  }
}
