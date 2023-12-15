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
  private container: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private webview: WebviewTag | null = null;

  constructor(props: Props) {
    super(props);

    this.state = { input: props.src, search: "", engine: Setting.searchengines.findIndex(({ selected }) => selected), searchengines: Setting.searchengines, zoom: 100 };
    Emit.on("webview:searchengines", this.onSearchengines);
  }

  componentDidMount() {
    const container = this.container.current;

    if (container) {
      container.innerHTML = `<webview src="${this.getUrl()}" allowpopups="on" />`
      this.webview = container.querySelector("webview");
    }

    if (this.webview) {
      this.webview.addEventListener("did-finish-load", this.onLoad);
      this.webview.addEventListener("did-navigate", this.onLoad);
      this.webview.addEventListener("did-navigate-in-page", this.onLoad);
    }
  }

  componentDidUpdate(props: Props) {
    if (this.webview && this.props.src !== props.src) {
      this.setState({ input: this.props.src });
      this.webview.src = this.getUrl();
    }
  }

  componentWillUnmount = () => {
    if (this.webview) {
      this.webview.removeEventListener("did-finish-load", this.onLoad);
      this.webview.removeEventListener("did-navigate", this.onLoad);
      this.webview.removeEventListener("did-navigate-in-page", this.onLoad);
    }

    Emit.off("webview:searchengines", this.onSearchengines);
  }

  private getUrl() {
    return this.props.src.search(/^(https?:\/\/\w+)|(data:.*\/(.*);base64)/) ? "about:blank" : this.props.src;
  }

  private onSearchengines = () => {
    this.setState({ engine: Setting.searchengines.findIndex(({ selected }) => selected), searchengines: Setting.searchengines });
  }

  private mouseCancel = (e: MouseEvent) => {
    e.stopPropagation();
  }

  private onFocus = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.select();
  }

  private onChangeSrc = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ input: e.target.value });
  }

  private onSubmitSrc = (e: FormEvent) => {
    const input = this.state.input;
    const engine = this.state.searchengines[this.state.engine] || this.state.searchengines[0];

    e.stopPropagation();
    e.preventDefault();

    if (!this.webview) return;

    if (input) {
      const src = input.search(/^https?:\/\/\w+/) ? engine.uri.replace("${query}", encodeURIComponent(input)) : input;

      this.webview.src = src;
    } else {
      this.setState({ input: this.webview.getURL() });
    }

    Emit.share("envim:focus");
  }

  private onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;

    this.setState({ search });

    if (this.webview && !search) {
      this.webview.stopFindInPage("clearSelection");
    }
  }

  private onSubmitSearch = (e: FormEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (this.webview) {
      this.webview.findInPage(this.state.search);
    }
  }

  private onLoad = () => {
    if (this.webview) {
      const url = this.webview.getURL();

      url === "about:blank" || this.setState({ input: url });
    }
  }

  private runAction(navigation: "backward" | "forward" | "reload" | "zoom-out"| "zoom-in" | "devtool") {
    if (this.webview) {
      switch (navigation) {
        case "backward": return this.webview.goBack();
        case "forward": return this.webview.goForward();
        case "reload": return this.webview.reloadIgnoringCache();
        case "zoom-out": return this.setZoom(this.state.zoom - 10)
        case "zoom-in": return this.setZoom(this.state.zoom + 10)
        case "devtool": return this.webview.isDevToolsOpened() ? this.webview.closeDevTools() : this.webview.openDevTools();
      }
    }
  }

  private setZoom(zoom: number) {
    if (this.webview) {
      zoom = Math.min(Math.max(zoom , 0), 300);

      this.setState({ zoom });
      this.webview.setZoomLevel((zoom / 100) - 1);
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

  private async addEngine(e: MouseEvent) {
    Emit.share("envim:focus");
    e.stopPropagation();
    e.preventDefault();

    if (this.webview) {
      const name = await Emit.send<string>("envim:api", "nvim_call_function", ["EnvimInput", ["Engine - Name"]]);
      const uri = await Emit.send<string>("envim:api", "nvim_call_function", ["EnvimInput", ["Engine - URI", this.webview.getURL()]]);

      Setting.searchengines = [
        ...this.state.searchengines.map(engine => ({ ...engine, selected: false })),
        { name, uri, selected: true }
      ].sort((a, b) => a.name > b.name ? 1 : -1);

      this.setState({ engine: Setting.searchengines.findIndex(engine => engine.name === "name") });
      Emit.share("webview:searchengines");
    }
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
        <IconComponent color="green-fg" font="" onClick={e => this.addEngine(e)} />
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
              <input style={styles.input} type="text" value={this.state.input} disabled={!this.props.src.search(/^data:.*\/(.*);base64/)} onChange={this.onChangeSrc} onFocus={this.onFocus} />
            </form>
          </FlexComponent>
          <IconComponent font="" />
          <form onSubmit={this.onSubmitSearch}>
            <input type="text" value={this.state.search} onChange={this.onChangeSearch} onFocus={this.onFocus} />
          </form>
          <IconComponent font="" onClick={() => this.runAction("zoom-out")} />
          { this.state.zoom }%
          <IconComponent font="" onClick={() => this.runAction("zoom-in")} />
          <IconComponent font="󱁤" onClick={() => this.runAction("devtool")} />
        </FlexComponent>
        <FlexComponent color="default" grow={1}>
          <div className="space" ref={this.container} />
        </FlexComponent>
      </FlexComponent>
    )
  }
}
