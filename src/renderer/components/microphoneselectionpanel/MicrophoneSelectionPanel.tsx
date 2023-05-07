/* eslint-disable no-undef */
import * as React from 'react';
import { Microphone } from 'common/RecordableDevices';
import SVG from 'react-inlinesvg';

import './MicrophoneSelectionPanel.scss';
import MicrophoneSVGPath from '../../../../assets/microphone.svg';
import CheckedCircleSvgPath from '../../../../assets/checkedcircle.svg';

export interface MicrophoneSelectionPanelProps {
  microphones: Microphone[];
  currentMicrophoneEndpoint: string;
  selectionDisabled: boolean;
  // eslint-disable-next-line no-unused-vars
  onMicrophoneSelected: (microphone: Microphone) => void;
}

// eslint-disable-next-line react/prefer-stateless-function
export class MicrophoneSelectionPanel extends React.Component<MicrophoneSelectionPanelProps> {
  render() {
    const {
      microphones,
      currentMicrophoneEndpoint,
      selectionDisabled,
      onMicrophoneSelected,
    } = this.props;

    const microphoneItems: JSX.Element[] = microphones.map((microphone) => {
      const isCurrentMicrophone =
        microphone.endpoint === currentMicrophoneEndpoint;
      let className = isCurrentMicrophone ? 'selected-list-item' : '';
      className += selectionDisabled ? ' selection-disabled' : '';
      let microphoneName = microphone.name;
      let microphoneDetail = '';
      const parenIndex = microphone.name.indexOf('(');
      const rightParenIndex = microphone.name.lastIndexOf(')');
      if (parenIndex >= 0 && rightParenIndex > parenIndex) {
        microphoneName = microphone.name.substring(0, parenIndex).trim();
        microphoneDetail = microphone.name
          .substring(parenIndex + 1, rightParenIndex)
          .trim();
      }

      // remove technical terms for better UX
      microphoneName = microphoneName.replace('Array', '').trim();

      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <li
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          key={microphone.endpoint}
          title={microphone.name}
          onClick={() => !selectionDisabled && onMicrophoneSelected(microphone)}
          className={className}
          value={microphone.endpoint}
        >
          <SVG className="list-item-icon" src={MicrophoneSVGPath} />
          <div className="list-item-info">
            <div className="list-item-name">{microphoneName}</div>
            <p>{microphoneDetail}</p>
          </div>
          {isCurrentMicrophone && (
            <SVG className="checkmark-icon" src={CheckedCircleSvgPath} />
          )}
        </li>
      );
    });

    return (
      <div className="microphone-selection-panel">
        {microphoneItems.length === 0 && <span>No Audio Inputs Found</span>}
        <ul>{microphoneItems}</ul>
      </div>
    );
  }
}
