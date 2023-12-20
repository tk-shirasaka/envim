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
  style: { [k: string]: string };
}

interface States {
  input: string;
  search: string;
  title: string;
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
  private input: RefObject<HTMLInputElement> = createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    this.state = { input: props.src, search: "", title: "", searchengines: Setting.searchengines, zoom: 100 };
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
      this.webview.addEventListener("page-title-updated", this.onLoad);
    }
  }

  componentDidUpdate(props: Props) {
    if (this.webview && this.props.src !== props.src) {
      this.setState({ input: this.props.src });
      this.webview.src = this.getUrl();
    }

    if (props.style.display === "none" && !this.props.style.display) {
      this.input.current?.focus();
    }
  }

  componentWillUnmount = () => {
    if (this.webview) {
      this.webview.removeEventListener("did-finish-load", this.onLoad);
      this.webview.removeEventListener("did-navigate", this.onLoad);
      this.webview.removeEventListener("did-navigate-in-page", this.onLoad);
      this.webview.removeEventListener("page-title-updated", this.onLoad);
    }

    Emit.off("webview:searchengines", this.onSearchengines);
  }

  private getUrl() {
    return this.props.src.search(/^(https?:\/\/\w+)|(data:.*\/(.*);base64)/) ? "about:blank" : this.props.src;
  }

  private onSearchengines = () => {
    this.setState({ searchengines: Setting.searchengines });
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
    const selected = this.state.searchengines.find(({ selected }) => selected);

    e.stopPropagation();
    e.preventDefault();

    if (!this.webview) return;

    if (input && selected) {
      const src = input.search(/^https?:\/\/\w+/) ? selected.uri.replace("${query}", encodeURIComponent(input)) : input;

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
      const title = this.webview.getTitle();

      url === "about:blank" || this.setState({ input: url, title });
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

  private setEngine(name: string) {
    const selected = this.state.searchengines.find(engine => engine.name === name);

    if (this.webview && selected && selected.uri.indexOf("${query}") < 0) {
      this.webview.src = selected.uri;
    } else {
      const searchengines = this.state.searchengines.map(engine => ({ ...engine, selected: selected === engine }));

      this.setState({ searchengines });
      this.input.current?.focus();
      Setting.searchengines = searchengines;
    }
  }

  private deleteEngine(e: MouseEvent, name: string) {
    const selected = this.state.searchengines.find(engine => engine.name === name);

    e.stopPropagation();
    e.preventDefault();

    Setting.searchengines = this.state.searchengines.filter(engine => selected !== engine);
    Emit.share("webview:searchengines");
  }

  private async addEngine(e: MouseEvent) {
    Emit.share("envim:focus");
    e.stopPropagation();
    e.preventDefault();

    if (this.webview) {
      const name = await Emit.send<string>("envim:api", "nvim_call_function", ["EnvimInput", ["Name"]]);
      const uri = name && await Emit.send<string>("envim:api", "nvim_call_function", ["EnvimInput", ["URI", this.webview.getURL()]]);
      const selected = uri.indexOf("${query}") >= 0;

      if (name && uri) {
        Setting.searchengines = [
          ...this.state.searchengines.filter(engine => engine.name !== name).map(engine => ({ ...engine, selected: engine.selected && !selected })),
          { name, uri, selected }
        ].sort((a, b) => a.name > b.name ? 1 : -1);

        Emit.share("webview:searchengines");
      }
    }

    this.input.current?.focus();
  }

  private renderEngine(base: string) {
    const regexp = new RegExp(`^${base}`);
    const searchengines = this.state.searchengines.filter(({ name }) => name.match(regexp)).map(({ name, ...other }) => ({ ...other, name: name.replace(regexp, "") }));
    const groups = searchengines.map(({ name }) => name.split("/")).reduce((all, curr) => curr.length === 1 || all.indexOf(curr[0]) >= 0 ? all : [...all, curr[0]], []);
    const selected = this.state.searchengines.find(({ selected }) => selected);

    return (
      <>
        { groups.map(group =>
          <MenuComponent key={`${base}${group}`} color="lightblue-fg" label={`󰉋 ${group}`} active={selected?.name.indexOf(`${base}${group}/`) === 0} side>
            { this.renderEngine(`${base}${group}/`) }
          </MenuComponent>
        ) }
        { searchengines.filter(({ name }) => name.split("/").length === 1).map(({ name, selected }, i) =>
          <FlexComponent  key={`${base}-${i}`} animate="hover" active={selected} onClick={() => this.setEngine(`${base}${name}`)} spacing>
            { name }
            <IconComponent color="gray" font="" float="right" onClick={(e) => this.deleteEngine(e, `${base}${name}`)} hover />
          </FlexComponent>
        ) }
      </>
    );
  }

  render() {
    return (
      <FlexComponent direction="column" position="absolute" color="default" overflow="visible" inset={[0]} style={this.props.style} onMouseUp={this.mouseCancel} onMouseDown={this.mouseCancel}>
        <FlexComponent color="gray-fg" horizontal="center">{ this.state.title }</FlexComponent>
        <FlexComponent vertical="center" overflow="visible">
          <IconComponent font="" onClick={() => this.runAction("backward")} />
          <IconComponent font="" onClick={() => this.runAction("forward")} />
          <IconComponent font="󰑓" onClick={() => this.runAction("reload")} />
          <MenuComponent color="blue-fg" label="󰖟">
            { this.renderEngine("") }
            <IconComponent color="green-fg" font="" onClick={e => this.addEngine(e)} />
          </MenuComponent>
          <FlexComponent grow={1} padding={[0, 8, 0, 0]}>
            <form style={styles.form} onSubmit={this.onSubmitSrc}>
              <input style={styles.input} type="text" ref={this.input} value={this.state.input} disabled={!this.props.src.search(/^data:.*\/(.*);base64/)} onChange={this.onChangeSrc} onFocus={this.onFocus} />
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
