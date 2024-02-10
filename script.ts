import {
  config,
  Script,
  ListWidget,
  Color,
  Font,
  LinearGradient,
  Alert,
  Request,
  WidgetStack,
} from "nios-scriptable";

// ANY CONFIGS YOU WISH TO ADD
const SHOW_TEXT = true;
const SIMULATE_ERROR = false;

// YOUR MAIN FUNCTION
async function mainScript() {
  const displayer = myInfo();

  if (config.runsInWidget) {
    let widget = displayer.has_error
      ? await createErrorWidget(displayer as BadTestInfo)
      : await createWidget(displayer as TestInfo);

    Script.setWidget(widget);
  } else {
    const options = ["Small", "Medium", "Large", "Cancel"];
    let resp = await presentAlert("Preview Widget", options, false);

    if (resp == options.length - 1) return;
    let size = options[resp];

    let widget = displayer.has_error
      ? await createErrorWidget(displayer as BadTestInfo)
      : await createWidget(displayer as TestInfo, size.toLowerCase());

    switch (size) {
      case "Small":
        await widget.presentSmall();
        break;
      case "Medium":
        await widget.presentMedium();
        break;
      case "Large":
        await widget.presentLarge();
        break;
    }
  }

  Script.complete();
}

await mainScript();

// YOUR CUSTOM CODE FOR THE SCRIPT
interface TestInfo {
  has_error: boolean;
  imgUrl: string;
  url: string;
  text: string;
}

interface BadTestInfo {
  has_error: boolean;
  err_msg: string;
}

function myInfo() {
  const urlRedirect = "https://scriptable.app/";
  const imageUrl = "https://scriptable.app/assets/appicon.png";
  var title = "Sample text using Scriptable!";
  const simulateError = SIMULATE_ERROR;

  if (simulateError) {
    return {
      has_error: true,
      err_msg: "This text is displayed because there was an error",
    } as BadTestInfo;
  } else {
    return {
      has_error: false,
      imgUrl: imageUrl,
      url: urlRedirect,
      text: title,
    } as TestInfo;
  }
}

// Useful short function to add text quickly to a stack
function addText(
  container: WidgetStack,
  text: string,
  align: string,
  size: number
) {
  const txt = container.addText(text);

  switch (align) {
    default:
      txt.leftAlignText();
      break;
    case "center":
      txt.centerAlignText();
      break;
    case "right":
      txt.rightAlignText();
      break;
  }

  txt.font = Font.systemFont(size);
  txt.shadowRadius = 3;
  txt.textColor = Color.white();
  txt.shadowColor = Color.black();
}

// Linear gradent for readability for text at the bottom of widget
function newLinearGradient(hexcolors: string[], locations: number[]) {
  let gradient = new LinearGradient();
  gradient.locations = locations;
  gradient.colors = hexcolors.map((color) => new Color(color));
  return gradient;
}

// Display an alert
async function presentAlert(prompt: string, items: string[], asSheet: boolean) {
  let alert = new Alert();
  alert.message = prompt;

  for (const item of items) {
    alert.addAction(item);
  }

  let resp = asSheet ? await alert.presentSheet() : await alert.presentAlert();
  return resp;
}

// CREATE YOUR WIDGETS
async function createWidget(
  data: TestInfo,
  widgetFamily: string | null = null
) {
  widgetFamily = widgetFamily || config.widgetFamily;
  const padd = widgetFamily == "large" ? 12 : 10;
  const fontSize = widgetFamily == "large" ? 14 : 10;

  const widget = new ListWidget();
  const req = new Request(data.imgUrl);
  const img = await req.loadImage();

  const refreshRate = 5; // min

  var refreshDate = Date.now() + 1000 * 60 * refreshRate;
  widget.refreshAfterDate = new Date(refreshDate);

  widget.url = data.url;
  widget.setPadding(padd, padd, padd, padd);
  widget.backgroundImage = img;

  if (SHOW_TEXT) {
    // add gradient with a semi-transparent
    // dark section at the bottom. this helps
    // with the readability of the status line
    widget.backgroundGradient = newLinearGradient(
      ["#ffffff00", "#ffffff00", "#00000088"],
      [0, 0.8, 1]
    );

    // top spacer to push the bottom stack down
    widget.addSpacer();

    // horizontal stack to hold the status line
    const stats = widget.addStack();
    stats.layoutHorizontally();
    stats.centerAlignContent();
    stats.spacing = 3;

    addText(stats, data.text, "left", fontSize);
    stats.addSpacer();
  }
  return widget;
}

// Just in case. It is not needed
async function createErrorWidget(data: BadTestInfo) {
  const widget = new ListWidget();
  widget.addSpacer();

  const text = widget.addText(data.err_msg);
  text.textColor = Color.white();
  text.centerAlignText();

  widget.addSpacer();

  return widget;
}
