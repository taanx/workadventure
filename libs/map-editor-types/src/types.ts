import { ITiledMapObject } from "@workadventure/tiled-map-type-guard";
import { UpdateAreaCommandConfig } from './Commands/Area/UpdateAreaCommand';

export type ITiledMapRectangleObject = ITiledMapObject & { width: number; height: number };

export type CommandConfig = UpdateAreaCommandConfig;

export enum AreaType {
    Static = "Static",
    Dynamic = "Dynamic",
}

export enum GameMapProperties {
    ALLOW_API = "allowApi",
    AUDIO_LOOP = "audioLoop",
    AUDIO_VOLUME = "audioVolume",
    BBB_MEETING = "bbbMeeting",
    CHAT_NAME = "chatName",
    COLLIDES = "collides",
    DEFAULT = "default",
    EXIT_URL = "exitUrl",
    EXIT_SCENE_URL = "exitSceneUrl",
    FONT_FAMILY = "font-family",
    FOCUSABLE = "focusable",
    JITSI_ADMIN_ROOM_TAG = "jitsiRoomAdminTag",
    JITSI_CONFIG = "jitsiConfig",
    JITSI_INTERFACE_CONFIG = "jitsiInterfaceConfig",
    JITSI_ROOM = "jitsiRoom",
    JITSI_TRIGGER = "jitsiTrigger",
    JITSI_TRIGGER_MESSAGE = "jitsiTriggerMessage",
    JITSI_URL = "jitsiUrl",
    JITSI_WIDTH = "jitsiWidth",
    JITSI_NO_PREFIX = "jitsiNoPrefix",
    NAME = "name",
    OPEN_TAB = "openTab",
    OPEN_WEBSITE = "openWebsite",
    OPEN_WEBSITE_ALLOW_API = "openWebsiteAllowApi",
    OPEN_WEBSITE_POLICY = "openWebsitePolicy",
    OPEN_WEBSITE_WIDTH = "openWebsiteWidth",
    OPEN_WEBSITE_POSITION = "openWebsitePosition",
    OPEN_WEBSITE_CLOSABLE = "openWebsiteClosable",
    OPEN_WEBSITE_TRIGGER = "openWebsiteTrigger",
    OPEN_WEBSITE_TRIGGER_MESSAGE = "openWebsiteTriggerMessage",
    PLAY_AUDIO = "playAudio",
    PLAY_AUDIO_LOOP = "playAudioLoop",
    POLICY = "policy",
    READABLE_BY = "readableBy",
    SCRIPT = "script",
    SCRIPT_DISABLE_MODULE_SUPPORT = "scriptDisableModuleSupport",
    SILENT = "silent",
    START = "start",
    START_LAYER = "startLayer",
    URL = "url",
    WRITABLE_BY = "writableBy",
    ZONE = "zone",
    ZOOM_MARGIN = "zoom_margin",
}
