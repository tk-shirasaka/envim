import { WebviewTag } from "electron";
import React, { createRef, RefObject, MouseEvent, FormEvent, ChangeEvent } from "react";

import { ISetting } from "../../common/interface";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

import { FlexComponent } from "./flex";
import { MenuComponent } from "./menu";
import { IconComponent } from "./icon";

interface Props {
  src: string;
  style: Object;
}

interface States {
  src: string;
  input: string;
  search: string;
  engine: number;
  searchengines: ISetting["searchengines"];
  zoom: number;
}

const styles = {
  form: {
    width: "100%",
  },
  input: {
    width: "100%",
  },
};

export class WebviewComponent extends React.Component<Props, States> {
  private webview: RefObject<WebviewTag> = createRef<WebviewTag>();

  constructor(props: Props) {
    super(props);

    this.state = this.getInitialState(props);
    Emit.on("webview:searchengines", this.onSearchengines);
  }

  componentDidUpdate(props: Props, state: States) {
    const webview = this.webview.current;

    if (webview) {
      if (this.state.src && !state.src) {
        webview.addEventListener("did-finish-load", this.onLoad);
        webview.addEventListener("did-navigate", this.onLoad);
        webview.addEventListener("did-navigate-in-page", this.onLoad);
      } else if (!this.state.src && state.src) {
        webview.removeEventListener("did-finish-load", this.onLoad);
        webview.removeEventListener("did-navigate", this.onLoad);
        webview.removeEventListener("did-navigate-in-page", this.onLoad);
      }
    }

    if (this.props.src !== props.src) {
      const { src, input } = this.getInitialState(this.props);

      this.setState({ src, input });
    }
  }

  componentWillUnmount = () => {
    Emit.off("webview:searchengines", this.onSearchengines);
  }

  private getInitialState(props: Props) {
    const src = props.src.search(/^(https?:\/\/\w+)|(data:.*\/(.*);base64)/) ? "" : props.src;
    const input = src ? "" : props.src;

    return { src, input, search: "", engine: Setting.searchengines.findIndex(({ selected }) => selected), searchengines: Setting.searchengines, zoom: 100 };
  }

  private onSearchengines = () => {
    const { engine, searchengines } = this.getInitialState(this.props);

    this.setState({ engine, searchengines });
  }

  private mouseCancel = (e: MouseEvent) => {
    e.stopPropagation();
  }

  private onChangeSrc = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ input: e.target.value });
  }

  private onSubmitSrc = (e: FormEvent) => {
    const input = this.state.input;
    const engine = this.state.searchengines[this.state.engine] || this.state.searchengines[0];

    e.stopPropagation();
    e.preventDefault();

    if (input) {
      const src = input.search(/^https?:\/\/\w+/) ? engine.uri.replace("${query}", encodeURIComponent(input)) : input;

      this.setState({ src });
    } else {
      this.setState({ input: this.state.src });
    }
  }

  private onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const webview = this.webview.current;
    const search = e.target.value;

    this.setState({ search });

    if (webview && !search) {
      webview.stopFindInPage("clearSelection");
    }
  }

  private onSubmitSearch = (e: FormEvent) => {
    const webview = this.webview.current;

    e.stopPropagation();
    e.preventDefault();

    if (webview) {
      webview.findInPage(this.state.search);
    }
  }

  private onLoad = () => {
    const webview = this.webview.current;

    if (webview) {
      this.setState({ input: webview.getURL() });
    }
  }

  private runAction(navigation: "backward" | "forward" | "reload" | "devtool") {
    const webview = this.webview.current;

    if (webview) {
      switch (navigation) {
        case "backward": return webview.goBack();
        case "forward": return webview.goForward();
        case "reload": return webview.reloadIgnoringCache();
        case "devtool": return webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
      }
    }
  }

  private setZoom(zoom: number) {
    const webview = this.webview.current;

    if (webview) {
      zoom = Math.min(Math.max(zoom , 0), 300);

      this.setState({ zoom });
      webview.setZoomLevel((zoom / 100) - 1);
    }
  }

  private setEngine(engine: number) {
    this.setState({ engine });

    Setting.searchengines = this.state.searchengines.map((searchengine, i) => ({ ...searchengine, selected: engine === i }));
  }

  private deleteEngine(e: MouseEvent, engine: number) {
    e.stopPropagation();
    e.preventDefault();

    Setting.searchengines = this.state.searchengines.filter((_, i) => engine !== i);
    Emit.share("webview:searchengines");
  }

  private renderEngine() {
    return (
      <MenuComponent color="blue-fg" label="󰖟">
        { this.state.searchengines.map(({ name }, i) => (
          <FlexComponent key={i} animate="hover" active={i === this.state.engine} onClick={() => this.setEngine(i)} spacing>
            { name }
            <IconComponent color="gray" font="" float="right" onClick={(e) => this.deleteEngine(e, i)} hover />
          </FlexComponent>
        )) }
      </MenuComponent>
    );
  }

  render() {
    return (
      <FlexComponent direction="column" position="absolute" color="default" inset={[0]} style={this.props.style} onMouseUp={this.mouseCancel} onMouseDown={this.mouseCancel}>
        <FlexComponent vertical="center" overflow="visible">
          <IconComponent font="" onClick={() => this.runAction("backward")} />
          <IconComponent font="" onClick={() => this.runAction("forward")} />
          <IconComponent font="󰑓" onClick={() => this.runAction("reload")} />
          { this.renderEngine() }
          <FlexComponent grow={1} padding={[0, 8, 0, 0]}>
            <form style={styles.form} onSubmit={this.onSubmitSrc}>
              <input style={styles.input} type="text" value={this.state.input} disabled={!this.state.src.search(/^data:.*\/(.*);base64/)} onChange={this.onChangeSrc} />
            </form>
          </FlexComponent>
          <IconComponent font="" />
          <form onSubmit={this.onSubmitSearch}>
            <input type="text" value={this.state.search} onChange={this.onChangeSearch} />
          </form>
          <IconComponent font="" onClick={() => this.setZoom(this.state.zoom - 10)} />
          { this.state.zoom }%
          <IconComponent font="" onClick={() => this.setZoom(this.state.zoom + 10)} />
          <IconComponent font="󱁤" onClick={() => this.runAction("devtool")} />
        </FlexComponent>
        <FlexComponent vertical="center" horizontal="center" color="default" grow={1}>
          { this.state.src && <webview ref={this.webview} src={this.state.src} /> }
        </FlexComponent>
      </FlexComponent>
    )
  }
}
