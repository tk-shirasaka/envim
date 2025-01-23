import React, { useEffect, useState } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";

import { FlexComponent } from "../flex";
import { MessageComponent } from "./message";

interface States {
  messages: IMessage[];
  enabled: boolean;
}

const styles = {
  scope: {
    overflow: "hidden auto",
    width: 300,
    maxHeight: "100%",
  },
  messages: {
    overflow: "hidden auto",
  },
};

export function NotificateComponent() {
  const [state, setState] = useState<States>({ messages: [], enabled: Setting.options.ext_messages });

  useEffect(() => {
    Emit.on("messages:show", onShow);
    Emit.on("option:set", onOption);

    return () => {
      Emit.off("messages:show", onShow);
      Emit.off("option:set", onOption);
    };
  }, []);

  function onShow(messages: IMessage[], replace: boolean) {
    setState(state => {
      replace && state.messages.splice(0);

      return {
        ...state,
        messages: [ ...state.messages, ...messages ].reduce(
          (all: IMessage[], curr: IMessage) => {
            const last = all.pop();

            if (last && last.kind === curr.kind) {
              curr.contents = [ ...last.contents, { hl: "0", content: "\n" }, ...curr.contents ];
            } else if (last) {
              all.push(last);
            }

            return [ ...all, curr ];
          },
          []
        )
      };
    })
  }

  function onOption(options: { ext_messages: boolean }){
    options.ext_messages === undefined || setState(state => ({ ...state, enabled: options.ext_messages }));
  }

  return state.enabled && state.messages.length > 0 && (
    <FlexComponent direction="column" inset={["auto", 0, 0, "auto"]} position="absolute" style={styles.scope} spacing>
      {state.messages.map((message, i) =>
        <FlexComponent animate="slide-right" margin={[4, 0]} rounded={[4]} style={styles.messages} key={i} shadow><MessageComponent message={message} open /></FlexComponent>
      )}
    </FlexComponent>
  );
}
