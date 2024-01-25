import { WebviewTag } from "electron";
import React, { createRef, RefObject, MouseEvent, FormEvent, ChangeEvent, KeyboardEvent } from "react";

import { ISetting } from "../../common/interface";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

import { FlexComponent } from "./flex";
import { MenuComponent } from "./menu";
import { IconComponent } from "./icon";

interface Props {
  src: string;
  active: number;
  style: { [k: string]: string };
}

interface States {
  input: string;
  search: string;
  title: string;
  loading: boolean;
  focus: boolean;
  searchengines: ISetting["searchengines"];
  zoom: number;
}

const position: "absolute" = "absolute";
const styles = {
  command: {
    position,
    width: 0,
    height: 0,
    padding: 0,
  },
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
  private search: RefObject<HTMLInputElement> = createRef<HTMLInputElement>();
  private command: RefObject<HTMLInputElement> = createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);

    this.state = { input: props.src, search: "", title: "", loading: false, focus: false, searchengines: Setting.searchengines, zoom: 100 };
    Emit.on("webview:action", this.onAction);
    Emit.on("webview:searchengines", this.onSearchengines);
  }

  componentDidMount() {
    const container = this.container.current;

    if (container) {
      container.innerHTML = `<webview src="${this.getUrl(this.props.src)}" allowpopups="on" />`;
      const webview = container.querySelector("webview") as WebviewTag;
      const listener = () => {
        const url = this.getUrl(this.props.src);

        this.webview = webview;
        this.webview.removeEventListener("dom-ready", listener);
        this.webview.addEventListener("did-start-loading", this.onLoad);
        this.webview.addEventListener("did-stop-loading", this.onLoad);
        this.webview.addEventListener("did-finish-load", this.onLoad);
        this.webview.addEventListener("did-navigate", this.onLoad);
        this.webview.addEventListener("did-navigate-in-page", this.onLoad);
        this.webview.addEventListener("page-title-updated", this.onLoad);
        this.webview.addEventListener("focus", this.onWebviewFocus);
        this.webview.addEventListener("blur", this.onWebviewBlur);

        url == this.webview.getURL() || (this.webview.src = url);
      }

      webview.addEventListener("dom-ready", listener);
    }
  }

  componentDidUpdate(props: Props) {
    if (this.webview && this.props.src !== props.src) {
      this.setState({ input: this.props.src });
      this.webview.src = this.getUrl(this.props.src);
    }

    if (this.webview && props.active < this.props.active) {
      this.runAction(this.webview.getURL() === "about:blank" ? "mode-input" : "mode-command");
    }
  }

  componentWillUnmount = () => {
    if (this.webview) {
      this.webview.removeEventListener("did-start-loading", this.onLoad);
      this.webview.removeEventListener("did-stop-loading", this.onLoad);
      this.webview.removeEventListener("did-finish-load", this.onLoad);
      this.webview.removeEventListener("did-navigate", this.onLoad);
      this.webview.removeEventListener("did-navigate-in-page", this.onLoad);
      this.webview.removeEventListener("page-title-updated", this.onLoad);
      this.webview.removeEventListener("focus", this.onWebviewFocus);
      this.webview.removeEventListener("blur", this.onWebviewBlur);
    }

    Emit.off("webview:action", this.onAction);
    Emit.off("webview:searchengines", this.onSearchengines);
  }

  private getUrl(input: string) {

    if (!input) {
      return "about:blank";
    } else if (input.search(/^((https?)|(file):\/\/)|(data:.*\/(.*);base64)/) === 0) {
      return input;
    } else {
      const selected = this.state.searchengines.find(({ selected }) => selected);

      return selected?.uri.replace("${query}", encodeURIComponent(input)) || "about:blank";
    }
  }

  private getMode() {
    switch (document.activeElement) {
      case this.command.current: return "mode-command";
      case this.input.current: return "mode-input";
      case this.search.current: return "mode-search";
      case this.webview: return "mode-browser";
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const modkey = e.ctrlKey || e.metaKey;

    e.stopPropagation();
    e.preventDefault();

    if (!this.webview) return;

    switch (modkey && e.key) {
      case "r": return this.runAction("reload");
      case "i": return this.runAction("devtool");
      case "u": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "PageUp" });
      case "d": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "PageDown" });
      case "s": return Emit.send("envim:browser", this.webview.getURL(), "new");
      case "v": return Emit.send("envim:browser", this.webview.getURL(), "vnew");
      case "t": return Emit.send("envim:browser", this.webview.getURL());
    }

    switch (e.key) {
      case "h": return this.runAction("navigate-backward");
      case "j": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "Down" })
      case "k": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "Up" })
      case "l": return this.runAction("navigate-forward");
      case "N": return this.runAction("search-backward");
      case "n": return this.runAction("search-forward");
      case "g": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "Home" });
      case "G": return this.webview.sendInputEvent({ type: "keyDown", keyCode: "End" });
      case "-": return this.runAction("zoom-out");
      case "+": return this.runAction("zoom-in");
      case "i": return this.runAction("mode-browser");
      case ":": return this.runAction("mode-input");
      case "/": return this.runAction("mode-search");
      case "Escape": return this.runAction("mode-command");
    }
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
    e.stopPropagation();
    e.preventDefault();

    if (!this.webview) return;

    if (this.state.input) {
      this.webview.src = this.getUrl(this.state.input);
    } else {
      this.setState({ input: this.webview.getURL() });
    }
    this.runAction("mode-command");
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

    this.runAction("mode-command");
    this.runAction("search-forward");
  }

  private onLoad = () => {
    if (this.webview) {
      const mode = this.getMode();
      const url = this.webview.getURL();
      const input = url === "about:blank" ? "" : url;
      const title = this.webview.getTitle();
      const loading = this.webview.isLoading();

      mode === "mode-input" ? this.setState({ title, loading }) : this.setState({ input, title, loading });
      mode === "mode-browser" && this.runAction("mode-command");
    }
  }

  private onWebviewFocus = () => {
    this.setState({ focus: true });
  }

  private onWebviewBlur = () => {
    this.setState({ focus: false });
  }

  private onAction = (id: number, action: string) => {
    this.webview?.getWebContentsId() === id && this.runAction(action);
  }

  private runAction(action: string) {
    if (this.webview) {
      switch (action) {
        case "search-backward": return this.state.search && this.webview.findInPage(this.state.search, { forward: false });
        case "search-forward": return this.state.search && this.webview.findInPage(this.state.search, { forward: true });
        case "navigate-backward": return this.webview.goBack();
        case "navigate-forward": return this.webview.goForward();
        case "reload": return this.webview.reloadIgnoringCache();
        case "zoom-out": return this.setZoom(this.state.zoom - 10)
        case "zoom-in": return this.setZoom(this.state.zoom + 10)
        case "devtool": return this.webview.isDevToolsOpened() ? this.webview.closeDevTools() : this.webview.openDevTools();
        case "mode-browser": return this.webview.focus();
        case "mode-input": return this.input.current?.focus() || this.webview.stopFindInPage("clearSelection");
        case "mode-search": return this.search.current?.focus() || this.webview.stopFindInPage("clearSelection");
        case "mode-command": return this.command.current?.focus() || this.webview.stopFindInPage("clearSelection");
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

  private selectEngine(e: MouseEvent, name: string) {
    const selected = this.state.searchengines.find(engine => engine.name === name);

    if (this.webview && selected && selected.uri.indexOf("${query}") < 0) {
      if (e.ctrlKey || e.metaKey) {
        Emit.send("envim:browser", selected.uri);
      } else {
        this.webview.src = selected.uri;
      }
    } else {
      const searchengines = this.state.searchengines.map(engine => ({ ...engine, selected: selected === engine }));

      this.setState({ searchengines });
      this.runAction("mode-input");
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

  private async saveEngine(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (this.webview) {
      const uri = await Emit.send<string>("envim:readline", "URI", this.webview.getURL());
      const selected = this.state.searchengines.find(engine => engine.uri === uri);
      const name = uri && await Emit.send<string>("envim:readline", "Name", selected?.name || "");
      const hasquery = uri.indexOf("${query}") >= 0;

      if (uri && name) {
        Setting.searchengines = [
          ...this.state.searchengines.filter(engine => engine.name !== name && engine.uri !== uri).map(engine => ({ ...engine, selected: engine.selected && !hasquery })),
          { name, uri, selected: hasquery }
        ].sort((a, b) => a.name > b.name ? 1 : -1);

        Emit.share("webview:searchengines");
      }
    }

    this.runAction("mode-input");
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
          <FlexComponent  key={`${base}-${i}`} animate="hover" active={selected} onClick={e => this.selectEngine(e, `${base}${name}`)} spacing>
            { name }
            <IconComponent color="gray" font="" float="right" onClick={e => this.deleteEngine(e, `${base}${name}`)} hover />
          </FlexComponent>
        ) }
      </>
    );
  }

  render() {
    const icon = this.state.searchengines.some(({ uri }) => uri === this.state.input)
      ? { color: "blue-fg", font: "" }
      : { color: "gray-fg", font: "" };

    return (
      <FlexComponent animate="fade-in" direction="column" position="absolute" color="default" overflow="visible" inset={[0]} style={this.props.style} onMouseUp={this.mouseCancel} onMouseDown={this.mouseCancel}>
        <input style={styles.command} ref={this.command} type="text" onKeyDown={this.onKeyDown} />
        <FlexComponent color="gray-fg" vertical="center" horizontal="center">
          { this.state.loading && <div className="animate loading inline"></div> }
          <FlexComponent margin={[0, 8]}>{ this.state.title }</FlexComponent>
        </FlexComponent>
        <FlexComponent vertical="center" overflow="visible">
          <IconComponent font="" onClick={() => this.runAction("navigate-backward")} />
          <IconComponent font="" onClick={() => this.runAction("navigate-forward")} />
          <IconComponent font="󰑓" onClick={() => this.runAction("reload")} />
          <MenuComponent color="blue-fg" label="󰖟">
            { this.renderEngine("") }
          </MenuComponent>
          <IconComponent { ...icon } onClick={e => this.saveEngine(e)} />
          <FlexComponent grow={1} shrink={2} padding={[0, 8, 0, 0]}>
            <form style={styles.form} onSubmit={this.onSubmitSrc}>
              <input style={styles.input} type="text" ref={this.input} value={this.state.input} disabled={!this.props.src.search(/^data:.*\/(.*);base64/)} onChange={this.onChangeSrc} onFocus={this.onFocus} />
            </form>
          </FlexComponent>
          <IconComponent font="" />
          <FlexComponent shrink={3}>
            <form style={styles.input} onSubmit={this.onSubmitSearch}>
              <input style={styles.input} type="text" ref={this.search} value={this.state.search} onChange={this.onChangeSearch} onFocus={this.onFocus} />
            </form>
          </FlexComponent>
          <IconComponent font="" onClick={() => this.runAction("zoom-out")} />
          { this.state.zoom }%
          <IconComponent font="" onClick={() => this.runAction("zoom-in")} />
          <IconComponent font="󱁤" onClick={() => this.runAction("devtool")} />
        </FlexComponent>
        <FlexComponent color={this.state.focus ? "blue" : "default"} margin={[2]} padding={[2]} border={[1]} rounded={[2]} grow={1} shadow>
          <div className="space" ref={this.container} />
        </FlexComponent>
      </FlexComponent>
    )
  }
}
