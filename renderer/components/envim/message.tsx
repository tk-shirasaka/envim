import React, { useState } from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";

interface Props {
  message: IMessage;
  open: boolean;
}

interface States {
  open: boolean;
}

const styles = {
  message: {
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  action: {
    height: 1,
  },
};

export function MessageComponent(props: Props) {
  const [state, setState] = useState<States>({ open: props.open });
  const icon = notificates.filter(icon => icon.kinds.indexOf(props.message.kind) >= 0)[0];
  const defaultHl = props.message.contents[0].hl;
  const defaultStyle = Highlights.style(defaultHl);

  function onToggleOpen() {
    setState(state => ({ ...state, open: !state.open }));
  }

  function contentStyle(defaultStyle: { [k: string]: string }, style: { [k: string]: string }) {
    return { ...style, ...(defaultStyle.background === style.background ? { background: "" } : {}) };
  }

  return (
    <FlexComponent grow={1} basis="0" onClick={onToggleOpen}>
      <IconComponent font={icon.font} style={Highlights.style(defaultHl, { reverse: true, normal: true })} />
      <FlexComponent whiteSpace={state.open ? "pre-wrap" : "nowrap"} grow={1} shrink={1} basis="0" padding={[2, 4]} style={defaultStyle} selectable>
        <div style={styles.message}>
          {props.message.contents.map(({hl, content}, i) => <span style={contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
        </div>
      </FlexComponent>
    </FlexComponent>
  );
}
